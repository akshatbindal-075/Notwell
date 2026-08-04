# Notewell — AI Clinical Documentation Assistant

<p align="center">
  <img src="frontend/public/notewell-logo.png" width="80" alt="Notewell logo" />
</p>

<p align="center">
  <strong>AI-powered clinical documentation for healthcare professionals.</strong><br/>
  6-agent pipeline · Patient history · SOAP notes · Treatment plans · Follow-ups · Human approval · PDF discharge summaries
</p>

<p align="center">
  <img src="https://img.shields.io/badge/backend-FastAPI-009688?style=flat-square&logo=fastapi" />
  <img src="https://img.shields.io/badge/frontend-Next.js-000000?style=flat-square&logo=nextdotjs" />
  <img src="https://img.shields.io/badge/LLM-Groq%20%2B%20OpenRouter-4ade80?style=flat-square" />
  <img src="https://img.shields.io/badge/deploy%20backend-Railway-0B0D0E?style=flat-square&logo=railway" />
  <img src="https://img.shields.io/badge/deploy%20frontend-Vercel-000000?style=flat-square&logo=vercel" />
</p>

---

## What is Notewell?

Notewell is a multi-agent clinical documentation system built on the **OpenAI Agents SDK**, running entirely on **Groq + OpenRouter** — no OpenAI API key required.

A clinician pastes a consultation transcript. Six AI agents process it sequentially, each handing off to the next:

```
Consultation Transcript
        │
        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ 1. Patient       │────▶│ 2. Clinical Note │────▶│ 3. Medical      │
│    History       │     │    Writer        │     │    Summary      │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                          │
                                                          ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ 6. Documentation │◀────│ 5. Follow-up    │◀────│ 4. Treatment    │
│    Reviewer      │     │    Coordinator  │     │    Planner      │
└────────┬────────┘     └─────────────────┘     └─────────────────┘
         │
         ▼
  Human Approval Gate ──▶ Finalized PDF Discharge Summary
```

### Key features

- **6 agents, 7 tools** — ICD-10 lookup, RAG retrieval, PDF generation, appointment scheduling, email notification, risk scoring, medication check
- **No OpenAI key** — runs on Groq (llama-3.3-70b-versatile) + OpenRouter with automatic multi-key rate-limit fallback
- **RAG** — prior consultation history stored in ChromaDB; retrieved on subsequent visits
- **Human-in-the-loop** — documentation reviewer flags issues; a clinician approves before the summary is finalized
- **PDF download** — discharge summary generated with fpdf2

---

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11, FastAPI, openai-agents SDK |
| LLM routing | Groq (`llama-3.3-70b-versatile`), OpenRouter |
| Vector store | ChromaDB |
| Database | SQLite (dev) / PostgreSQL (prod via Railway) |
| Frontend | Next.js 14, Tailwind CSS, Framer Motion |
| PDF | fpdf2 |
| Deploy backend | Railway |
| Deploy frontend | Vercel |

---

## Local development

### Prerequisites

- Python 3.11+
- Node.js 18+
- API keys: [Groq](https://console.groq.com/keys) · [OpenRouter](https://openrouter.ai/keys)

### 1. Clone

```bash
git clone https://github.com/your-username/notewell.git
cd notewell
```

### 2. Backend

```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env   # then fill in your keys
uvicorn app.main:app --reload
# → http://localhost:8000
```

**Required `.env` values:**

```env
GROQ_API_KEY=gsk_...
OPENROUTER_API_KEY=sk-or-...
ALLOWED_ORIGINS=http://localhost:3001
```

Optional (for multi-key rate-limit fallback):
```env
GROQ_API_KEY_2=gsk_...
GROQ_API_KEY_3=gsk_...
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_BASE_URL
npm run dev
# → http://localhost:3001
```

**`.env.local`:**
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
```

---

## Deployment

### Backend → Railway

1. **Push to GitHub** — push the whole repo (or just `backend/`).

2. **New Railway project**
   - Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
   - Select your repo; set **Root Directory** to `backend`

3. **Add PostgreSQL**
   - In Railway dashboard: + New → Database → PostgreSQL
   - Copy the `DATABASE_URL` from the Postgres service → add it to your backend service's Variables

4. **Set environment variables** in Railway → your backend service → Variables:

   | Variable | Value |
   |---|---|
   | `GROQ_API_KEY` | `gsk_...` |
   | `GROQ_API_KEY_2` | `gsk_...` (optional second key) |
   | `OPENROUTER_API_KEY` | `sk-or-...` |
   | `DATABASE_URL` | *(auto-set from Postgres plugin)* |
   | `ALLOWED_ORIGINS` | `https://your-app.vercel.app` |
   | `ENV` | `production` |

5. **Deploy** — Railway auto-detects `Dockerfile` (or `requirements.txt` + Nixpacks). Click Deploy.

6. Note your Railway URL: `https://your-app.up.railway.app`

---

### Frontend → Vercel

1. **Push to GitHub** (same repo is fine).

2. **Import in Vercel**
   - Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
   - Select your repo; set **Root Directory** to `frontend`
   - Framework preset: **Next.js** (auto-detected)

3. **Set environment variable** in Vercel → Settings → Environment Variables:

   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_API_BASE_URL` | `https://your-app.up.railway.app/api` |

4. **Deploy** — Vercel builds and deploys automatically.

5. Copy your Vercel domain (e.g. `https://notewell.vercel.app`) → go back to Railway → update `ALLOWED_ORIGINS` to include it.

---

## API reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/consultations/run` | Start the 6-agent pipeline |
| `GET` | `/api/consultations/{session_id}` | Poll pipeline status / result |
| `POST` | `/api/consultations/{session_id}/approve` | Submit human approval decision |
| `GET` | `/api/consultations/{session_id}/pdf` | Download PDF discharge summary |
| `POST` | `/api/patients` | Create patient record |
| `GET` | `/api/patients/{patient_id}` | Fetch patient record |
| `GET` | `/api/patients/{patient_id}/visits` | List prior visits (for RAG status) |
| `GET` | `/health` | Health check |

---

## Project structure

```
notewell/
├── backend/
│   ├── app/
│   │   ├── agents/          # 6 agent definitions
│   │   ├── api/
│   │   │   └── routes.py    # All FastAPI endpoints
│   │   ├── db/
│   │   │   ├── database.py  # SQLAlchemy setup
│   │   │   └── models.py    # Patient, PipelineRun, ApprovalRecord
│   │   ├── models/
│   │   │   └── schemas.py   # Pydantic schemas (PipelineResult etc.)
│   │   ├── services/
│   │   │   ├── pipeline_runner.py   # Orchestrates the 6-agent run
│   │   │   ├── structuring.py       # Free-text → Pydantic (direct Groq call)
│   │   │   ├── approval_manager.py  # Human approval logic
│   │   │   └── model_providers.py   # Groq/OpenRouter/Gemini clients + fallback
│   │   ├── tools/           # 7 tool implementations
│   │   ├── config.py
│   │   └── main.py          # FastAPI app, CORS, startup
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
│
├── frontend/
│   ├── app/
│   │   ├── layout.js        # Root layout + metadata (Notewell title/favicon)
│   │   ├── page.js          # Main 3-column UI
│   │   └── globals.css      # Emerald/teal design system
│   ├── components/
│   │   ├── AgentPipeline.js     # Live pipeline progress tracker
│   │   ├── AgentOutputTabs.js   # 6-tab output panel
│   │   ├── PatientSidebar.js    # Patient context + RAG status
│   │   ├── ApprovalCard.js      # Human approval form
│   │   ├── NewPatientForm.js    # Inline patient creation
│   │   └── Toast.js             # Error notifications
│   ├── lib/
│   │   └── api.js           # All fetch calls to the backend
│   ├── public/
│   │   └── notewell-logo.png
│   ├── tailwind.config.js
│   └── .env.local.example
│
├── .gitignore
└── README.md
```

---

## Environment variables reference

### Backend (`.env`)

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | ✅ | Primary Groq key |
| `GROQ_API_KEY_2` | Optional | Second Groq key (rate-limit fallback) |
| `OPENROUTER_API_KEY` | ✅ | OpenRouter key |
| `GEMINI_API_KEY` | Optional | Gemini key (long-context agent) |
| `DATABASE_URL` | Optional | Postgres URL (defaults to SQLite) |
| `ALLOWED_ORIGINS` | ✅ | Comma-separated list of frontend origins |
| `MODEL_FAST` | Optional | Override fast model (default: `llama-3.3-70b-versatile`) |
| `SENDGRID_API_KEY` | Optional | For email follow-up notifications |

### Frontend (`.env.local`)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | ✅ | Full URL to the backend API (e.g. `https://your-app.up.railway.app/api`) |

---

## License

MIT
