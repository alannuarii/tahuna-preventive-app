#!/bin/bash

PROJECT_NAME="preventive-tahuna"
ENV_FILE=".env"

echo "========================================"
echo "Starting Deployment: $PROJECT_NAME"
echo "========================================"

# 1. Cleanup
docker-compose -p $PROJECT_NAME down --rmi local --remove-orphans || true

# 2. Generate .env
cat <<EOF > $ENV_FILE
GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI=$GOOGLE_REDIRECT_URI
JWT_SECRET=$JWT_SECRET
DB_PASSWORD=$DB_PASSWORD
EOF

# 3. Build & Deploy
# Pastikan VITE_API_URL adalah path relatif
export VITE_API_URL="/api"
docker-compose -p $PROJECT_NAME up -d --build

echo "========================================"
echo "Deployment Complete on Port 3006"
echo "========================================"