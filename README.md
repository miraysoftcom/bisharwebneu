# Bisharwebsite

Plattenleger CMS projesi:

- Frontend: Next.js
- Backend: FastAPI
- Database: MongoDB

## Hızlı Başlangıç (Local)

1. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn server:app --app-dir . --host 0.0.0.0 --port 8000
```

2. Frontend

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev -- --port 3000
```

3. Kontrol

- Frontend: http://localhost:3000
- Backend docs: http://localhost:8000/docs

## Linux Kurulum Kılavuzu

Debian, Ubuntu ve AlmaLinux için adım adım üretim kurulum rehberi:

- docs/INSTALL_LINUX.md
