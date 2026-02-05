#!/bin/bash

# ==========================================
# Jenkins Deployment Script for Tahuna App
# ==========================================

PROJECT_NAME="preventive-tahuna"
ENV_FILE=".env"

echo "========================================"
echo "Starting Deployment: $PROJECT_NAME"
echo "========================================"

# 1. Validasi Variabel (Opsional tapi disarankan)
# Memastikan Jenkins sudah melempar variabel penting agar build tidak gagal di tengah
if [ -z "$DB_PASSWORD" ] || [ -z "$JWT_SECRET" ]; then
    echo "ERROR: Variabel lingkungan penting tidak ditemukan!"
    exit 1
fi

# 2. Cleanup Container & Images
echo "[1/3] Stopping old containers and removing local images..."
# --rmi local menghapus image yang di-build, --volumes menghapus volume anonim
docker-compose -p $PROJECT_NAME down --rmi local --remove-orphans || true

# 3. Generate .env
echo "[2/3] Generating $ENV_FILE..."
cat <<EOF > $ENV_FILE
PORT=3000
GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI=$GOOGLE_REDIRECT_URI
JWT_SECRET=$JWT_SECRET
FRONTEND_URL=http://preventive-tahuna:3000

# Database (Gunakan nama service jika DB ada di docker, atau IP host jika di luar)
DB_HOST=10.10.10.150
DB_PORT=5432
DB_USER=alannuarii
DB_PASSWORD=$DB_PASSWORD
DB_NAME=db_tahuna

VITE_API_URL=http://api-preventive-tahuna:8000
EOF

# 4. Build and Start
echo "[3/3] Building and starting services..."
docker-compose -p $PROJECT_NAME up -d --build

# 5. Post-Deployment Check
echo "========================================"
echo "Deployment Complete!"
docker-compose -p $PROJECT_NAME ps
echo "========================================"

# (Opsional) Hapus .env jika tidak ingin tersimpan di workspace Jenkins
# rm $ENV_FILE