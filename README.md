
 🌱 ESG Data Platform

### Enterprise ESG Compliance & Sustainability Analytics

> A full-stack enterprise ESG compliance platform that ingests emission data from SAP, utility portals, and corporate travel systems — normalises it through a multi-scope workflow, and surfaces a real-time analyst review dashboard with audit trails and outlier detection.

**Demo Credentials:** `analyst` / `demo1234`

</div>

---

## 📌 Overview

The ESG Data Platform automates the collection, normalisation, and review of corporate carbon emissions data across all three emission scopes. It provides sustainability analysts with a structured workflow to validate, flag, and approve emission records — complete with a full audit trail for regulatory compliance.

Built as a flagship project for enterprise sustainability reporting, the platform handles the complexity of multi-source emission ingestion, unit normalisation, and analyst oversight in a single cohesive system.

---

## 🚀 Live Demo

| Resource | URL |
|----------|-----|
| Frontend App | https://esg-data-platform-ten.vercel.app |
| Backend API | https://esg-data-platform.onrender.com |
| Login | analyst / demo1234 |

---
## Docs -
[MODEL.md](./MODEL.md) 
[DECISIONS.md](./DECISIONS.md)  
[TRADEOFFS.md](./TRADEOFFS.md) 
[SOURCES.md](./SOURCES.md)

## ✨ Features

### Data Ingestion
- Multi-source ingestion — SAP ERP exports, utility portal CSVs, and corporate travel platform feeds
- Automatic normalisation — converts disparate units (kWh, litres, km) into standardised CO₂e values
- Scope classification — automatically tags records as Scope 1 (direct), Scope 2 (purchased energy), or Scope 3 (value chain)

### Analyst Review System
- Queue-based review workflow — analysts see pending records in a structured approval queue
- Accept / Reject / Flag — granular actions with mandatory notes for audit purposes
- Bulk operations — process multiple records at once for high-volume reporting periods

### Audit Trail
- Immutable audit log — every action (create, review, approve, reject) is timestamped and tied to a user
- Change history — full diff of every record modification
- Export-ready — audit logs are exportable for regulatory submissions

### Outlier Detection
- Statistical anomaly flagging — records that deviate significantly from historical averages are auto-flagged
- Peer comparison — benchmarks emission factors against industry averages
- Alert notifications — analysts receive in-app alerts for flagged outliers

### Analytics Dashboard
- Recharts visualisations — scope breakdown, trend lines, and source distribution charts
- Real-time updates — dashboard reflects approved data instantly
- KPI cards — total emissions, records pending review, approval rate

---

## 🏗️ Architecture

┌─────────────────────────────────────────────────────────┐
│                     Data Sources                        │
│   SAP ERP Export  │  Utility Portal  │  Travel Platform │
└──────────┬──────────────┬───────────────────┬───────────┘
           │              │                   │
           ▼              ▼                   ▼
┌─────────────────────────────────────────────────────────┐
│              Django Ingestion Layer                     │
│    Unit Normalisation  →  Scope Tagging  →  Outlier     │
│                             Detection                   │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                 PostgreSQL Database                     │
│   EmissionRecords  │  AuditLog  │  Users  │  Settings  │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                Django REST Framework API                │
│     /api/records/   /api/review/   /api/analytics/      │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│           React 18 + Vite Frontend                      │
│   Dashboard  │  Review Queue  │  Analytics  │  Reports  │
└─────────────────────────────────────────────────────────┘

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend Framework | Django 5, Django REST Framework |
| Frontend | React 18, Vite, Recharts, Lucide Icons |
| Database (Production) | PostgreSQL |
| Database (Development) | SQLite |
| Hosting (Frontend) | Vercel |
| Hosting (Backend) | Render |
| Auth | Django Session Auth |

---

## 📊 Scope 1 / 2 / 3 Workflow

Scope 1 — Direct Emissions
  └── Combustion in owned/controlled sources (gas, diesel, fleet)

Scope 2 — Indirect Energy Emissions
  └── Purchased electricity, steam, heating, cooling

Scope 3 — Value Chain Emissions
  └── Business travel, supply chain, waste, employee commuting

Each ingested record is automatically tagged, normalized to tCO₂e, and placed in the appropriate review queue.

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/records/ | List all emission records |
| POST | /api/records/ | Ingest new emission data |
| GET | /api/records/{id}/ | Retrieve a single record |
| PATCH | /api/records/{id}/review/ | Submit analyst review |
| GET | /api/analytics/summary/ | Dashboard KPIs |
| GET | /api/analytics/trends/ | Time-series emission trends |
| GET | /api/audit/ | Full audit log |

---

## ⚙️ Installation

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL (for production) or SQLite (for development)

### Backend Setup

cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py seed_demo
python manage.py runserver

Backend runs at http://localhost:8000

### Frontend Setup

cd frontend
npm install
npm run dev

Frontend runs at http://localhost:5173

### Environment Variables

DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://user:password@localhost:5432/esg_db
ALLOWED_HOSTS=localhost,127.0.0.1

---

## 🚢 Deployment

| Service | Platform | Notes |
|---------|----------|-------|
| Frontend | Vercel | Auto-deploys on main branch push |
| Backend | Render | Free tier with PostgreSQL add-on |
| Database | Render PostgreSQL | Managed, auto-backups |

---

## 🧩 Challenges Solved

Multi-unit normalisation — Different data sources report in kWh, litres of diesel, passenger-km, and more. The platform implements a unit-agnostic normalisation layer that converts all values to tCO₂e using IPCC emission factors.

Audit immutability — Ensuring that once an analyst approves a record, the audit log cannot be modified requires careful database design with append-only audit tables.

Outlier detection without false positives — Used IQR-based statistical flagging with configurable sensitivity thresholds so analysts aren't overwhelmed with false alerts.

---

## 🗺️ Future Roadmap

- CSRD / GRI reporting template export
- Multi-tenant support for enterprise clients
- Automated SAP API integration (replace CSV export)
- Carbon offset tracking and net-zero projections
- Email digest for pending review queue

---

## 📚 Documentation

- MODEL.md — Data model and schema design
- DECISIONS.md — Architectural decision records
- TRADEOFFS.md — Technical tradeoffs and alternatives considered
- SOURCES.md — Emission factor data sources

---

## 👤 Author

Ayush Gupta — Backend & AI Systems Engineer

GitHub: https://github.com/ayush2459
LinkedIn: https://linkedin.com/in/ayush-gupta-933b5b287
