# Sunucudan Güncelleme & Deploy (adım adım)

Bu rehberde, projede bir değişiklik (örneğin bir script güncellemesi) yaptığında sunucuya nasıl aktaracağını ve siteyi nasıl güncelleyeceğini adım adım anlatıyorum. 14 yaşındaysan endişelenme — her komutu kopyala/yapıştır yap ve nerede takıldığını söyle.

Ön koşullar
- Sunucuna SSH ile erişimin olmalı (örn. `ssh user@your-server.com`).
- Sunucuda proje klasörünün tam yolu (ör: `/var/www/vhosts/plattenlegerallerart.ch/httpdocs`) bilinmeli.
- Sunucuda `git` yüklü ve proje git reposu olarak klonlanmış olmalı.
- Eğer servisleri `systemd`, `pm2` veya `nginx` ile çalıştırıyorsan, servis isimlerini bil (aşağıda örnek gösterildi).

Temel yöntemler (kısa)
1. Sunucuya bağlan: `ssh user@server`
2. Proje klasörüne git: `cd /path/to/site`
3. Kod çek: `git pull` (veya `git fetch` + `git reset --hard origin/branch`)
4. Backend için bağımlılıkları güncelle, veritabanı migrasyonu varsa çalıştır.
5. Frontend için `npm install` ve `npm run build` çalıştır.
6. Servisleri yeniden başlat (ör: `sudo systemctl restart your-backend.service`, `pm2 restart frontend`).

Detaylı adımlar (güvenli, adım adım)

1) Sunucuya bağlan

```bash
ssh user@your-server.com
# user ve your-server.com yerine sunucu kullanıcı adını ve adresini yaz
```

2) Çalışma dizinine git

```bash
cd /var/www/vhosts/plattenlegerallerart.ch/httpdocs
# bu yolu kendi sunucu yoluna göre değiştir
```

3) Değişiklikleri çek (güvenli şekilde)

```bash
# Güncelleme öncesi branch kontrolü
git status --porcelain
git fetch --all --prune
# Örnek: ana dalı (main) güncelle
git checkout main
git reset --hard origin/main
git clean -fd
```

4) Backend için (Python)

```bash
cd backend
# sanal ortamı aktif et (yoksa oluşturulur)
if [ -d .venv ]; then
  source .venv/bin/activate
else
  python3 -m venv .venv
  source .venv/bin/activate
fi

# bağımlılıkları güncelle
pip install --upgrade pip
pip install -r requirements.txt

# (opsiyonel) veritabanı migration veya seed varsa çalıştır
# örn: python manage_migrations.py
```

5) Backend servisini yeniden başlat

- Eğer `systemd` servisi kurduysan (ör: `bishar_backend.service`):

```bash
sudo systemctl restart bishar_backend
sudo systemctl status bishar_backend --no-pager
```

- Eğer doğrudan `uvicorn` ile arka planda çalıştırıyorsan, önce eski süreci durdur, sonra yeniden başlat (örnek güvenli):

```bash
# eski uvicorn süreçlerini durdur (nazikçe)
pkill -f 'uvicorn' || true
# yeni process başlat (daha sağlam yöntem: systemd service yaz)
nohup python -m uvicorn server:app --host 127.0.0.1 --port 8000 &
```

6) Frontend için

```bash
cd ../frontend
npm install --legacy-peer-deps
npm run build
```

- Eğer üretimde `pm2` ile çalıştırıyorsan:

```bash
# pm2 ile restart
pm2 restart bishar_frontend || pm2 start npm --name bishar_frontend -- run start
```

- Eğer nginx ile statik build servisi yapıyorsan, `npm run build` sonrası build klasörünü nginx'in serve ettiği yere kopyala veya nginx konfigürasyonunu kontrol et.

7) Nginx yeniden yükle (eğer kullanıyorsan)

```bash
sudo nginx -t && sudo systemctl reload nginx
```

8) Hızlı kontrol

- Backend: `curl -I http://127.0.0.1:8000/` veya `http://your-domain.com/docs`
- Frontend: tarayıcıda `https://your-domain.com` aç veya `curl -I https://your-domain.com`

Basit rollback (geri alma)

Eğer yeni sürüm sorun çıkardıysa, sunucuda aşağıdaki komutla önceki commit'e dönebilirsin:

```bash
cd /path/to/site
# örnek: bir commit öncesine dön
git log --oneline --decorate -n 5
# commit id'sini kopyala, sonra
git reset --hard <COMMIT_ID>
# sonra yeniden build ve servisleri başlat
```

Otomatik deploy scripti (örnek)

Aşağıda bir örnek `deploy.sh` scripti var. Bu scripti sunucudaki proje klasöründe çalıştırabilirsin. Script'i kendi servis isimlerine ve yollarına göre düzenle.

```bash
#!/usr/bin/env bash
set -e

REPO_DIR="/var/www/vhosts/plattenlegerallerart.ch/httpdocs"
BRANCH="${1:-main}"

echo "Deploying branch $BRANCH to $REPO_DIR"
cd "$REPO_DIR"

# Güvenli şekilde güncelle
git fetch --all --prune
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"
git clean -fd

# Backend güncelle
cd backend
if [ -d .venv ]; then
  source .venv/bin/activate
else
  python3 -m venv .venv
  source .venv/bin/activate
fi
pip install -r requirements.txt
# (opsiyonel) migration komutları buraya

# Backend restart - systemd kullanıyorsan servisi yeniden başlat
if systemctl list-unit-files | grep -q "bishar_backend.service"; then
  sudo systemctl restart bishar_backend
else
  pkill -f 'uvicorn' || true
  nohup python -m uvicorn server:app --host 127.0.0.1 --port 8000 &
fi

# Frontend güncelle
cd ../frontend
npm install --legacy-peer-deps
npm run build

# Frontend restart (pm2 örneği)
if command -v pm2 >/dev/null 2>&1; then
  pm2 restart bishar_frontend || pm2 start npm --name bishar_frontend -- run start
fi

# nginx reload
sudo nginx -t && sudo systemctl reload nginx || true

echo "Deploy finished"
```

Script kullanım örneği:

```bash
# sunucu içinde çalıştır
./deploy.sh main

# yerel bilgisayardan ssh ile çalıştır
ssh user@your-server.com 'cd /var/www/vhosts/plattenlegerallerart.ch/httpdocs && ./deploy.sh main'
```

İyi uygulamalar & notlar
- Her zaman önce `git status` ile yerel değişiklik olmadığından emin ol.
- `sudo` gerektiren komutları çalıştırabilmek için deploy kullanıcısının yetkisi olmalı veya `sudo` şifresini bilin.
- Üretimde `systemd` servisi yazmak daha güvenlidir; istersen `docs/scriptupdate/` içine örnek `systemd` servis dosyası da eklerim.
- Eğer dosya yüklemeleri varsa (uploads), build sırasında `uploads` klasörünü silme veya overwrite etmeme; onu ayrı tut.

Takılma noktaları olursa bana terminal çıktısını gönder; adım adım yardımcı olurum.











CHATGPT ANLATIMI