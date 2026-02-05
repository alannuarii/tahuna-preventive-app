#!/bin/bash
set -e  # SANGAT PENTING: Skrip akan berhenti jika ada error

PROJECT_NAME="preventive-tahuna"
ENV_FILE=".env"

echo "========================================"
echo "Starting Deployment: $PROJECT_NAME"
echo "========================================"

# 1. Cleanup
echo "[1/3] Stopping old containers..."
# Ganti docker-compose menjadi docker compose
docker compose -p $PROJECT_NAME down --rmi local --remove-orphans || true

# 2. Generate .env
# ... (bagian cat <<EOF tetap sama) ...

# 3. Build and Start
echo "[3/3] Building and starting services..."
export VITE_API_URL="/api"
# Ganti docker-compose menjadi docker compose
docker compose -p $PROJECT_NAME up -d --build

echo "========================================"
echo "Deployment Complete on Port 3006"
docker compose -p $PROJECT_NAME ps
echo "========================================"