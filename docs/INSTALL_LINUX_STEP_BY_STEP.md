# Bisharwebsite Linux Kurulum Rehberi

Bu rehberde `Debian`, `Ubuntu` ve `AlmaLinux` üzerinde adım adım kurulum yapacaksın. Her distro için ayrı ayrı talimatlar var.

> Not: 14 yaşındaysan, adımları dikkatle sırayla uygula. Eğer bir satırda hata alırsan önce terminal mesajını oku, sonra hata varsa bana söyle.

---

## 1. Ön Hazırlık

Her sistem için önce depoyu bilgisayara çek:

```bash
cd ~
git clone https://github.com/miraysoftcom/bisharwebneu.git
cd bisharwebneu
```

Bu komutlar proje klasörünü bilgisayarına indirir.

Ayrıca aşağıdaki yazılımları kurmak gerekiyor:

- Git
- Node.js 20
- npm
- Python 3.11+ veya 3.12
- Python virtualenv
- MongoDB 7

---

## 2. Debian 12 / Debian 13 Kurulumu

### 2.1. Sistem Paketlerini Güncelle

```bash
sudo apt update
sudo apt upgrade -y
```

### 2.2. Gerekli Paketleri Kur

```bash
sudo apt install -y git curl ca-certificates gnupg lsb-release python3 python3-venv python3-pip build-essential
```

### 2.3. Node.js 20 Kur

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

### 2.4. MongoDB 7 Kur

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

Eğer `server_status` veya `active` görürsen MongoDB çalışıyor demektir.

---

## 3. Ubuntu 22.04 / Ubuntu 24.04 Kurulumu

### 3.1. Sistem Paketlerini Güncelle

```bash
sudo apt update
sudo apt upgrade -y
```

### 3.2. Gerekli Paketleri Kur

```bash
sudo apt install -y git curl ca-certificates gnupg lsb-release python3 python3-venv python3-pip build-essential
```

### 3.3. Node.js 20 Kur

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

### 3.4. MongoDB 7 Kur

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

Ubuntu 24.04 kullanıyorsan `jammy` yerine `noble` kullanabilirsin.

---

## 4. AlmaLinux 8 / AlmaLinux 9 Kurulumu

### 4.1. Sistem Paketlerini Güncelle

```bash
sudo dnf update -y
```

### 4.2. Gerekli Paketleri Kur

```bash
sudo dnf install -y git curl python3 python3-pip python3-virtualenv gcc gcc-c++ make
```

### 4.3. Node.js 20 Kur

```bash
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs
node -v
npm -v
```

### 4.4. MongoDB 7 Kur

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

AlmaLinux 8 kullanıyorsan `baseurl` içinde `redhat/8` yaz.

---

## 5. Backend Kurulumu (Her Dağıtım İçin Aynı)

Bu adımı proje ana klasöründeyken yap.

```bash
cd ~/bisharwebneu/backend
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### 5.1. Backend Çalıştırma

```bash
source .venv/bin/activate
python -m uvicorn server:app --app-dir . --host 0.0.0.0 --port 8000
```

Tarayıcıyı aç ve kontrol et:

- `http://localhost:8000/docs`

Eğer çalışan bir FastAPI sayfası görürsen backend tamamdır.

---

## 6. Frontend Kurulumu (Her Dağıtım İçin Aynı)

```bash
cd ~/bisharwebneu/frontend
npm install --legacy-peer-deps
```

Opsiyonel ama tavsiye edilir: proje kökünde `.env.local` dosyası oluştur.

```bash
cat <<'EOF' > .env.local
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
EOF
```

### 6.1. Frontend Çalıştırma

```bash
npm run dev -- --port 3000
```

Tarayıcıda aç:

- `http://localhost:3000`

Eğer site gelir ve hata vermezse frontend de tamamdır.

---

## 7. Adım Adım Kontrol

1. `git clone` ettiğin dizine gir.
2. `backend` içinde sanal ortamı oluştur.
3. `pip install -r requirements.txt` çalıştır.
4. `backend`i `uvicorn` ile başlat.
5. `frontend` içinde `npm install` çalıştır.
6. `npm run dev -- --port 3000` ile frontend başlat.
7. İki farklı tarayıcı sekmesinde:
   - `http://localhost:8000/docs`
   - `http://localhost:3000`

---

## 8. Hata Olursa Ne Yapmalısın?

### 8.1. `command not found` hatası

- Eğer `python3` bulunamıyorsa `sudo apt install -y python3` veya `sudo dnf install -y python3` komutunu çalıştır.
- Eğer `npm` bulunamıyorsa `nodejs` doğru kurulmadı demektir.

### 8.2. MongoDB başlamazsa

```bash
sudo systemctl status mongod --no-pager
sudo systemctl restart mongod
sudo journalctl -u mongod --no-pager | tail -n 20
```

### 8.3. Frontend `npm install` sırasında hata

```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### 8.4. Backend `uvicorn` hata verirse

Sanal ortamın (`.venv`) aktif olduğundan emin ol:

```bash
source backend/.venv/bin/activate
python -m uvicorn server:app --app-dir backend --host 0.0.0.0 --port 8000
```

---

## 9. `GitHub`’a Push Etme

Bu kılavuzu da GitHub’a göndermek için aşağıdaki komutları kullan:

```bash
cd ~/bisharwebneu
git add docs/INSTALL_LINUX_STEP_BY_STEP.md
git commit -m "Add step-by-step Linux install guide for Debian, Ubuntu and AlmaLinux"
git push origin main
```

Bu şekilde yaptığın değişiklikler GitHub’a gider.

---

## 10. Özet

- Debian, Ubuntu ve AlmaLinux için ayrı ayrı komutları takip ettin.
- Backend için Python sanal ortamı kurdun.
- Frontend için Node.js paketlerini kurdun.
- MongoDB 7 çalıştırdın.

Bu talimatları adım adım uygularsan kurulumu sorunsuz tamamlayabilirsin.
