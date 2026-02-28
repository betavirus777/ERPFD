#!/bin/bash
# ============================================================
# HRMS-Next Deployment Script
# Usage: ./deploy.sh [--skip-build]
# Run this after pushing to main to deploy to the server.
# ============================================================

set -e

SERVER="hruser@hrerpfe1.uaenorth.cloudapp.azure.com"
APP_DIR="/var/www/hrms-next"
PM2_NAME="hrms-next"
PORT=3000

echo "🚀 HRMS-Next — Starting deployment..."

ssh "$SERVER" bash << 'REMOTE_SCRIPT'
  set -e

  # Load NVM
  export NVM_DIR="/home/hruser/.nvm"
  . "/home/hruser/.nvm/nvm.sh"

  APP_DIR="/var/www/hrms-next"
  PM2_NAME="hrms-next"
  PORT=3000

  echo "📥 Pulling latest code from main..."
  cd "$APP_DIR"
  git pull origin main

  echo "📦 Installing dependencies (if changed)..."
  npm ci --prefer-offline 2>/dev/null || npm install

  echo "🔨 Building Next.js app..."
  npm run build

  echo "📁 Copying static assets for standalone..."
  cp -r public .next/standalone/ 2>/dev/null || true
  cp -r .next/static .next/standalone/.next/ 2>/dev/null || true

  echo "♻️  Restarting PM2 process..."
  if pm2 list | grep -q "$PM2_NAME"; then
    PORT=$PORT pm2 restart "$PM2_NAME" --update-env
  else
    PORT=$PORT pm2 start .next/standalone/server.js --name "$PM2_NAME"
  fi

  pm2 save

  echo "🏥 Health check..."
  sleep 4
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT)
  
  if [ "$STATUS" = "200" ] || [ "$STATUS" = "307" ] || [ "$STATUS" = "302" ]; then
    echo "✅ Health check passed (HTTP $STATUS)"
    echo ""
    echo "🎉 Deployment complete! App running on port $PORT"
  else
    echo "❌ Health check failed (HTTP $STATUS)"
    pm2 logs "$PM2_NAME" --lines 20
    exit 1
  fi

  pm2 list
REMOTE_SCRIPT

echo ""
echo "✅ Deployment finished successfully!"
