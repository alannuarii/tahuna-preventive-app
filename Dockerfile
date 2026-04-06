# ---- Stage 1: Build ----
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the SolidStart application (produces .output/ via Nitro)
RUN npm run build

# Fix srvx FastURL bug: patch _url.mjs to handle relative URLs
# srvx@0.9.8 crashes with "Invalid URL" when Node.js passes relative paths
# (e.g. /login, /api/data) because new URL("/login") requires a base URL.
# This patch makes the _url getter prepend "http://localhost" for relative URLs.
RUN SRVX_URL_FILE=".output/server/node_modules/srvx/dist/_chunks/_url.mjs" && \
    if [ -f "$SRVX_URL_FILE" ]; then \
      sed -i 's|this.#url = new NativeURL(this.href);|const _h = this.href; this.#url = _h.startsWith("/") ? new NativeURL("http://localhost" + _h) : new NativeURL(_h);|' "$SRVX_URL_FILE" && \
      echo "✅ Patched srvx _url.mjs successfully" ; \
    else \
      echo "⚠️  srvx _url.mjs not found, skipping patch" ; \
    fi

# ---- Stage 2: Production ----
FROM node:22-alpine AS production

WORKDIR /app

# Add non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy the self-contained Nitro build output (includes all bundled deps + public assets)
COPY --from=builder /app/.output ./.output

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3000
ENV ORIGIN=https://preventive-tahuna.serveer.biz.id

# Expose port
EXPOSE 3000

# Change ownership so the non-root user can write necessary cache/temp files
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start the production Nitro server
CMD ["node", ".output/server/index.mjs"]
