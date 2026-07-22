# Debian (basit adım adım rehber)

Bu rehber Debian 12/13 üzerinde projeyi kurman için sade ve adım adım hazırlandı. Her komutu terminale kopyala-yapıştır ve Enter tuşuna bas. Takılırsan bana yaz.

Ön notlar:
- `sudo` komutu yönetici izni ister; bilgisayar sahibi sana parola verebilir.
- Bu proje için Python (FastAPI), Node.js (Next.js) ve MongoDB gerekiyor.

1) Sistem güncelle

```bash
sudo apt update
sudo apt upgrade -y
```

2) Gerekli araçları yükle

```bash
sudo apt install -y git curl ca-certificates gnupg lsb-release python3 python3-venv python3-pip build-essential
```

3) Node.js (örnek: 18/20) kur

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v && npm -v
```

4) MongoDB (yerel) kur (basit adımlar)

```bash
wget -qO - https://pgp.mongodb.com/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/debian bookworm/mongodb-org/7.0 main" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl enable --now mongod
sudo systemctl status mongod --no-pager
```

Ekranda `active (running)` görürsen MongoDB çalışıyor demektir.

5) Projeyi klonla

```bash
cd ~
git clone https://github.com/miraysoftcom/bisharwebneu.git
cd bisharwebneu
```

6) Backend (Python) ortamı hazırlama

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
cp .env.example .env
```

7) `.env` dosyasını düzenle (örnek değerler)

```bash
# editörle aç, örn: nano .env
nano .env

# Aşağıdakileri kontrol et veya ekle
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
JWT_SECRET=change-me
FRONTEND_URL=http://localhost:3000
```

8) Backend’i çalıştır (geliştirme)

```bash
source .venv/bin/activate
python -m uvicorn server:app --app-dir . --host 127.0.0.1 --port 8000 --reload
```

Tarayıcıda `http://127.0.0.1:8000/docs` açılmalı.

9) Frontend kur ve çalıştır

```bash
cd ../frontend
npm install
cat > .env.local <<'EOF'
NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8000
EOF
npm run dev -- --port 3000
```

Tarayıcıda `http://localhost:3000` aç.

10) Kontroller

- `sudo systemctl status mongod --no-pager` ile MongoDB
- `http://127.0.0.1:8000/docs` ile backend
- `http://localhost:3000` ile frontend

Sorun çıkarsa terminal çıktılarını buraya yapıştır, yardımcı olurum.
