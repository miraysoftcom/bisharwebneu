# Bisharwebsite Kurulum ve Kullanım Kılavuzu (Debian, Ubuntu, AlmaLinux)

Bu dokuman, projeyi Linux sunucuda calistirmak icin adim adim kurulum talimatlarini icerir.

## 1. Mimari Ozeti

- Frontend: Next.js (Node.js)
- Backend: FastAPI (Python + Uvicorn)
- Veritabani: MongoDB
- Opsiyonel: Nginx reverse proxy + HTTPS

Varsayilan portlar:

- Frontend: `3000`
- Backend: `8000`
- MongoDB: `27017`

## 2. Ortak Gereksinimler

Tum sistemler icin:

- Git
- Node.js 20 LTS
- npm
- Python 3.11+ (3.12 de olur)
- Python venv
- MongoDB 7

Projeyi cek:

```bash
git clone https://github.com/miraysoftcom/bisharwebneu.git
cd bisharwebneu
```

## 3. Debian 12 Kurulum

### 3.1 Sistem paketleri

```bash
sudo apt update
sudo apt install -y git curl ca-certificates gnupg lsb-release python3 python3-venv python3-pip build-essential
```

### 3.2 Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

### 3.3 MongoDB 7

```bash
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | \
  sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/debian bookworm/mongodb-org/7.0 main" | \
  sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

sudo apt update
sudo apt install -y mongodb-org
sudo systemctl enable --now mongod
sudo systemctl status mongod --no-pager
```

## 4. Ubuntu 22.04/24.04 Kurulum

### 4.1 Sistem paketleri

```bash
sudo apt update
sudo apt install -y git curl ca-certificates gnupg lsb-release python3 python3-venv python3-pip build-essential
```

### 4.2 Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

### 4.3 MongoDB 7

Ubuntu 22.04 icin:

```bash
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | \
  sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
  sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

sudo apt update
sudo apt install -y mongodb-org
sudo systemctl enable --now mongod
```

Ubuntu 24.04 icin `jammy` yerine `noble` deneyebilirsiniz.

## 5. AlmaLinux 8/9 Kurulum

### 5.1 Sistem paketleri

```bash
sudo dnf update -y
sudo dnf install -y git curl python3 python3-pip python3-virtualenv gcc gcc-c++ make
```

### 5.2 Node.js 20

```bash
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs
node -v
npm -v
```

### 5.3 MongoDB 7

AlmaLinux 9 icin:

```bash
cat <<'EOF' | sudo tee /etc/yum.repos.d/mongodb-org-7.0.repo
[mongodb-org-7.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/9/mongodb-org/7.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://pgp.mongodb.com/server-7.0.asc
EOF

sudo dnf install -y mongodb-org
sudo systemctl enable --now mongod
sudo systemctl status mongod --no-pager
```

AlmaLinux 8 kullaniyorsaniz `redhat/8` baseurl kullanin.

## 6. Backend Kurulumu

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### 6.1 Backend calistirma

```bash
cd /path/to/bisharwebneu/backend
source .venv/bin/activate
python -m uvicorn server:app --app-dir . --host 0.0.0.0 --port 8000
```

Kontrol:

- API docs: `http://SERVER_IP:8000/docs`

## 7. Frontend Kurulumu (Next.js)

```bash
cd /path/to/bisharwebneu/frontend
npm install --legacy-peer-deps
```

Opsiyonel `.env.local` olustur:

```bash
cat <<'EOF' > .env.local
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
EOF
```

### 7.1 Development calistirma

```bash
npm run dev -- --port 3000
```

Kontrol:

- Frontend: `http://SERVER_IP:3000`

### 7.2 Production build

```bash
npm run build
npm run start -- --port 3000
```

## 8. Systemd servisleri (onerilen)

### 8.1 Backend servisi

`/etc/systemd/system/bishar-backend.service`

```ini
[Unit]
Description=Bishar FastAPI Backend
After=network.target mongod.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/bisharwebneu/backend
Environment=PYTHONUNBUFFERED=1
ExecStart=/opt/bisharwebneu/backend/.venv/bin/python -m uvicorn server:app --app-dir /opt/bisharwebneu/backend --host 0.0.0.0 --port 8000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

### 8.2 Frontend servisi

`/etc/systemd/system/bishar-frontend.service`

```ini
[Unit]
Description=Bishar Next.js Frontend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/bisharwebneu/frontend
Environment=NODE_ENV=production
Environment=NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8000
ExecStart=/usr/bin/npm run start -- --port 3000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

Servisleri etkinlestir:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now bishar-backend
sudo systemctl enable --now bishar-frontend
sudo systemctl status bishar-backend --no-pager
sudo systemctl status bishar-frontend --no-pager
```

## 9. Nginx Reverse Proxy (tek domain)

`/etc/nginx/conf.d/bishar.conf`

```nginx
server {
    listen 80;
    server_name example.com;

    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Uygula:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 10. HTTPS (Let's Encrypt + certbot)

Nginx reverse proxy aktif olduktan sonra HTTPS sertifikasi alin.

### 10.1 Debian/Ubuntu

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d example.com -d www.example.com
```

### 10.2 AlmaLinux

```bash
sudo dnf install -y epel-release
sudo dnf install -y certbot python3-certbot-nginx
sudo certbot --nginx -d example.com -d www.example.com
```

### 10.3 Otomatik yenileme kontrolu

```bash
sudo systemctl status certbot.timer --no-pager
sudo certbot renew --dry-run
```

Nginx config icinde certbot tarafindan otomatik HTTPS block olusur. Son durumda site sadece `https://` ile servis edilmelidir.

## 11. Firewall

Ubuntu/Debian (UFW):

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

AlmaLinux (firewalld):

```bash
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

## 12. Sik sorunlar

### 11.1 Mongo baglantisi yok (`localhost:27017 refused`)

```bash
sudo systemctl status mongod --no-pager
sudo systemctl restart mongod
```

### 11.2 Frontend `next: command not found`

`frontend` klasorunde oldugunuzdan emin olun:

```bash
cd /path/to/bisharwebneu/frontend
npm install --legacy-peer-deps
npm run dev
```

### 11.3 Port cakismasi

```bash
lsof -ti tcp:3000 | xargs -r kill -9
lsof -ti tcp:8000 | xargs -r kill -9
```

## 13. Hizli kontrol listesi

- Mongo aktif mi?
- Backend `:8000` acik mi?
- Frontend `:3000` acik mi?
- `/docs` ve ana sayfa aciliyor mu?
- Nginx varsa `proxy_pass` dogru mu?
