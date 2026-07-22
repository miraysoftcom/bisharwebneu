# Systemd ile Servis Kurma (Backend + Frontend)

Aşağıda örnek `systemd` unit dosyalarını nasıl kurup etkinleştireceğin adım adım anlatılmıştır. Dosyaların örnek konumu: `docs/scriptupdate/` içinde.

Dosyalar
- `docs/scriptupdate/bishar_backend.service` — Backend için örnek unit
- `docs/scriptupdate/bishar_frontend.service` — Frontend için örnek unit

Adımlar

1) Sunucuya kopyala veya dosyaları oluştur

```bash
# sunucuda /etc/systemd/system/ dizinine kopyala (örnek):
scp docs/scriptupdate/bishar_backend.service user@your-server:/tmp/
scp docs/scriptupdate/bishar_frontend.service user@your-server:/tmp/
ssh user@your-server
sudo mv /tmp/bishar_backend.service /etc/systemd/system/bishar_backend.service
sudo mv /tmp/bishar_frontend.service /etc/systemd/system/bishar_frontend.service
```

2) systemd'yi yeniden yükle ve servisleri etkinleştir

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now bishar_backend.service
sudo systemctl enable --now bishar_frontend.service
```

3) Durumu kontrol et

```bash
sudo systemctl status bishar_backend.service --no-pager
sudo systemctl status bishar_frontend.service --no-pager
# Logları görmek için
sudo journalctl -u bishar_backend.service -f
sudo journalctl -u bishar_frontend.service -f
```

Önemli notlar
- `User=` satırını sunucuda çalışan kullanıcıya göre değiştir (örneğin `deploy` veya `www-data`).
- `WorkingDirectory` ve `ExecStart` yollarını sunucudaki proje yollarına göre güncelle.
- Frontend için `npm run start` yerine `pm2` kullanıyorsan `ExecStart` kısmını pm2 ile değiştir.
- Eğer servis başlamazsa `journalctl -xe` veya servis loguna bak; genelde PATH veya izin hatası olur.

İstersen bu dosyaları doğrudan `/etc/systemd/system/` için hazır hale getirip `deploy.sh`'ı güncelleyecek şekilde düzenleyeyim. Hangi kullanıcı adıyla (ör: `www-data` veya `deploy`) kurulum yapmak istersin? 
