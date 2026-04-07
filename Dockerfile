FROM node:22-alpine AS builder

WORKDIR /app

# Copy package.json and npm lockfile
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application source code
COPY . .

# Build the application
RUN npm run build

# Fix srvx FastURL bug: patch _url.mjs to handle relative URLs
# srvx crashes with "Invalid URL" when Node.js passes relative paths
# (e.g. /login, /api/data) because new URL("/login") requires a base URL.
RUN SRVX_URL_FILE=".output/server/node_modules/srvx/dist/_chunks/_url.mjs" && \
    if [ -f "$SRVX_URL_FILE" ]; then \
      sed -i 's|this.#url = new NativeURL(this.href);|const _h = this.href; this.#url = _h.startsWith("/") ? new NativeURL("http://localhost" + _h) : new NativeURL(_h);|' "$SRVX_URL_FILE" && \
      echo "✅ Patched srvx _url.mjs successfully" ; \
    else \
      echo "⚠️  srvx _url.mjs not found, skipping patch" ; \
    fi

# Production image
FROM node:22-alpine

WORKDIR /app

# Copy the built application from the builder stage
COPY --from=builder /app/.output ./.output

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3000
ENV ORIGIN=https://preventive-tahuna.serveer.biz.id

CMD ["node", ".output/server/index.mjs"]
