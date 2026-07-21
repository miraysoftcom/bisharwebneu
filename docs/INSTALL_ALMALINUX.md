# AlmaLinux için adım adım kurulum rehberi

Bu rehber AlmaLinux 8 veya 9 üzerinde projeyi sorunsuz kurmak için hazırlanmıştır.

## 1. Projeyi klonla

```bash
cd ~
git clone https://github.com/miraysoftcom/bisharwebneu.git
cd bisharwebneu
```

## 2. Sistem paketlerini güncelle

```bash
sudo dnf update -y
```

## 3. Gerekli paketleri kur

```bash
sudo dnf install -y git curl python3 python3-pip python3-virtualenv gcc gcc-c++ make
```

## 4. Node.js 20 kur

```bash
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs
node -v
npm -v
```

## 5. MongoDB 7 kur

AlmaLinux 9 için:

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

AlmaLinux 8 kullanıyorsan `redhat/9` yerine `redhat/8` yaz.

## 6. Backend ortamını kur

```bash
cd ~/bisharwebneu/backend
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
cp .env.example .env
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
- Backend çalışıyor mu?
- Frontend çalışıyor mu?

## 11. Hata varsa

```bash
sudo systemctl status mongod --no-pager
sudo systemctl restart mongod
```
