#!/bin/bash

# ==========================================
# Jenkins Deployment Script for Tahuna App
# ==========================================

# Set Project Name for Docker Compose
PROJECT_NAME="tahuna-preventive"

echo "========================================"
echo "Starting Deployment: $PROJECT_NAME"
echo "Date: $(date)"
echo "========================================"

# 1. Clean up old containers and networks
# Matches 'docker stop' and 'docker rm' from reference, but for all services
echo "[1/3] Stopping and removing existing containers..."
docker-compose -p $PROJECT_NAME down --remove-orphans || true

# 2. Clean up old images to ensure fresh build and save space
# Matches 'docker rmi' from reference
echo "[2/3] Cleaning up old images..."
docker rmi tahuna-frontend api-tahuna-preventive simple-auth-service || true

# 3. Build and Start Services
# Matches 'docker build' and 'docker run' from reference
# We use docker-compose to handle the networking and restart policies automatically
echo "[3/3] Building and starting services..."

# Note: Ensure these ENV variables are set in Jenkins:
# - GOOGLE_CLIENT_ID
# - GOOGLE_CLIENT_SECRET
# - GOOGLE_REDIRECT_URI
# - JWT_SECRET
# - DB_PASSWORD

docker-compose -p $PROJECT_NAME up -d --build

echo "========================================"
echo "Deployment Complete!"
echo "Status:"
docker-compose -p $PROJECT_NAME ps
echo "========================================"
