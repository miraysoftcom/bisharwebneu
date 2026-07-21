# Ubuntu için adım adım kurulum rehberi

Bu rehber Ubuntu 22.04 veya 24.04 üzerinde projeyi sorunsuz kurmak için hazırlanmıştır.

## 1. Projeyi klonla

```bash
cd ~
git clone https://github.com/miraysoftcom/bisharwebneu.git
cd bisharwebneu
```

## 2. Sistem paketlerini güncelle

```bash
sudo apt update
sudo apt upgrade -y
```

## 3. Gerekli paketleri kur

```bash
sudo apt install -y git curl ca-certificates gnupg lsb-release python3 python3-venv python3-pip build-essential
```

## 4. Node.js 20 kur

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

## 5. MongoDB 7 kur

Ubuntu 22.04 için:

```bash
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | \
  sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
  sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

sudo apt update
sudo apt install -y mongodb-org
sudo systemctl enable --now mongod
sudo systemctl status mongod --no-pager
```

Ubuntu 24.04 kullanıyorsan `jammy` yerine `noble` yaz.

## 6. Backend ortamını kur

```bash
cd ~/bisharwebneu/backend
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
cp .env.example .env
```

`.env` dosyasını doğrula:

```bash
sed -n '1,20p' .env
```

## 7. Backend'i çalıştır

```bash
source .venv/bin/activate
python -m uvicorn server:app --app-dir . --host 0.0.0.0 --port 8000
```

Kontrol et:

- http://localhost:8000/docs

## 8. Frontend'i kur

```bash
cd ~/bisharwebneu/frontend
npm install --legacy-peer-deps
cat > .env.local <<'EOF'
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
EOF
```

## 9. Frontend'i çalıştır

```bash
npm run dev -- --port 3000
```

Kontrol et:

- http://localhost:3000

## 10. Son kontrol

- MongoDB aktif mi?
- Backend sayfası açılıyor mu?
- Frontend ana sayfası açılıyor mu?

## 11. Hata varsa

```bash
sudo systemctl status mongod --no-pager
sudo systemctl restart mongod
```
