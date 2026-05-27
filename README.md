# ESG Data Platform — Breathe ESG Intern Assignment

A Django + React app that ingests emission data from SAP, utility portals, and corporate travel platforms, normalizes it, and surfaces a review dashboard for analysts.

## Live Demo
- **App:** https://esg-data-platform-ten.vercel.app
- **Login:** `analyst` / `demo1234`

## Docs
- [MODEL.md](./MODEL.md)
- [DECISIONS.md](./DECISIONS.md)
- [TRADEOFFS.md](./TRADEOFFS.md)
- [SOURCES.md](./SOURCES.md)

## Stack
Backend: Django 5, DRF, SQLite (dev) / PostgreSQL (prod)
Frontend: React 18, Vite, Recharts, Lucide

## Local Setup
### Backend
```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```
### Frontend
```bash
cd frontend
npm install
npm run dev
```
