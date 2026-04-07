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
