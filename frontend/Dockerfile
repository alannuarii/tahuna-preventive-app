# Stage 1: Build Vue
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
ARG VITE_API_URL
ARG VITE_AUTH_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_AUTH_URL=$VITE_AUTH_URL
COPY . .
RUN npm run build

# Stage 2: Serve dengan Caddy
FROM caddy:alpine
COPY --from=builder /app/dist /usr/share/caddy
# Copy Caddyfile internal yang sudah kita buat
COPY Caddyfile /etc/caddy/Caddyfile
EXPOSE 3000