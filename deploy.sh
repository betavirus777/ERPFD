#!/bin/bash
# ============================================================
# HRMS-Next Deployment Script
# Usage: ./deploy.sh
# Run this after pushing to main to deploy to the server.
# ============================================================

SERVER_USER="hruser"
SERVER_HOST="hrerpfe1.uaenorth.cloudapp.azure.com"
SERVER_PASSWORD="B@#77NZf7Y131QOiE"
APP_DIR="/var/www/hrms-next"
PM2_NAME="hrms-next"
PORT=3000

echo "🚀 HRMS-Next — Starting deployment to $SERVER_HOST..."

expect << EXPECT_SCRIPT
set timeout 600
spawn ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_HOST}
expect "password:"
send "${SERVER_PASSWORD}\r"
expect "$ "

send "export NVM_DIR=\"/home/hruser/.nvm\" && . \"/home/hruser/.nvm/nvm.sh\"\r"
expect "$ "

send "cd ${APP_DIR}\r"
expect "$ "

send "echo '📥 Pulling latest code...'\r"
expect "$ "
send "git pull origin main 2>&1\r"
expect "$ "

send "echo '🔨 Building Next.js app...'\r"
expect "$ "
send "npm run build 2>&1\r"
expect {
    -timeout 600
    "$ " {}
    timeout { puts "❌ Build timed out"; exit 1 }
}

send "echo '📁 Copying static assets...'\r"
expect "$ "
send "cp -r public .next/standalone/ 2>/dev/null; cp -r .next/static .next/standalone/.next/ 2>/dev/null\r"
expect "$ "

send "echo '♻️  Restarting PM2...'\r"
expect "$ "
send "PORT=${PORT} pm2 restart ${PM2_NAME} --update-env 2>&1\r"
expect "$ "

send "pm2 save\r"
expect "$ "

send "echo '🏥 Running health check...'\r"
expect "$ "
send "sleep 4 && curl -s -o /dev/null -w 'Health: %{http_code}' http://localhost:${PORT} && echo ''\r"
expect "$ "

send "pm2 list\r"
expect "$ "

send "exit\r"
expect eof
EXPECT_SCRIPT

EXIT_CODE=$?
if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "✅ Deployment complete!"
else
    echo ""
    echo "❌ Deployment failed with exit code $EXIT_CODE"
    exit 1
fi
