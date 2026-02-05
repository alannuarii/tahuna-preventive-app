#!/bin/bash

PROJECT_NAME="preventive-tahuna"
ENV_FILE=".env"

echo "========================================"
echo "Starting Deployment: $PROJECT_NAME"
echo "Target Port: 3006"
echo "========================================"

# 1. Cleanup
docker-compose -p $PROJECT_NAME down --rmi local --remove-orphans || true

# 2. Generate .env
cat <<EOF > $ENV_FILE
PORT=3000
GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI=$GOOGLE_REDIRECT_URI
JWT_SECRET=$JWT_SECRET

# URL publik (tanpa port karena sudah di-handle Caddy & Cloudflare)
FRONTEND_URL=https://preventive-tahuna.serveer.biz.id
VITE_API_URL=/api

# Database
DB_HOST=10.10.10.150
DB_PORT=5432
DB_USER=alannuarii
DB_PASSWORD=$DB_PASSWORD
DB_NAME=db_tahuna
EOF

# 3. Build & Run
# Export argumen untuk Vite build process
export VITE_API_URL="/api"
docker-compose -p $PROJECT_NAME up -d --build

echo "========================================"
echo "Deployment Complete on Port 3006!"
echo "========================================"