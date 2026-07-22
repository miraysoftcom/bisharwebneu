#!/usr/bin/env bash
set -e

# Basit deploy örneği - Lütfen PATH ve servis isimlerini kendi sistemine göre güncelle
REPO_DIR="/var/www/vhosts/plattenlegerallerart.ch/httpdocs"
BRANCH="${1:-main}"

echo "Deploying branch $BRANCH to $REPO_DIR"
cd "$REPO_DIR"

# Güncelle
git fetch --all --prune
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"
git clean -fd

# Backend
cd backend
if [ -d .venv ]; then
  source .venv/bin/activate
else
  python3 -m venv .venv
  source .venv/bin/activate
fi
pip install -r requirements.txt

# Restart backend (örnek)
if systemctl list-unit-files | grep -q "bishar_backend.service"; then
  sudo systemctl restart bishar_backend
else
  pkill -f 'uvicorn' || true
  nohup python -m uvicorn server:app --host 127.0.0.1 --port 8000 &
fi

# Frontend
cd ../frontend
npm install --legacy-peer-deps
npm run build

# Restart frontend with pm2 if available
if command -v pm2 >/dev/null 2>&1; then
  pm2 restart bishar_frontend || pm2 start npm --name bishar_frontend -- run start
fi

# Reload nginx
sudo nginx -t && sudo systemctl reload nginx || true

echo "Deploy finished"
