<h1 align="center">
  <img src="frontend/public/notewell-logo.png" alt="Notewell Logo" width="30" style="vertical-align: middle;">
  <span style="vertical-align: middle;">Notewell</span>
</h1>
<p align="center">
  <strong>AI Clinical Documentation Assistant</strong>
</p>

<p align="center">
  <img src="frontend/public/screenshot.png" alt="Notewell — AI Clinical Documentation Assistant UI" width="100%"/>
</p>

<p align="center">
  <strong>Autonomous Multi-Agent Clinical Documentation & RAG Intelligence Pipeline</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python"/>
  <img src="https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI"/>
  <img src="https://img.shields.io/badge/Next.js-14-000000?style=flat-square&logo=nextdotjs&logoColor=white" alt="Next.js"/>
  <img src="https://img.shields.io/badge/OpenAI%20Agents%20SDK-000000?style=flat-square" alt="Agents SDK"/>
  <img src="https://img.shields.io/badge/Groq-llama--3.3--70b-F55036?style=flat-square" alt="Groq"/>
  <img src="https://img.shields.io/badge/OpenRouter-Multi--LLM-6366F1?style=flat-square" alt="OpenRouter"/>
  <img src="https://img.shields.io/badge/ChromaDB-Vector%20Store-FF6F00?style=flat-square" alt="ChromaDB"/>
  <img src="https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white" alt="SQLite"/>
  <img src="https://img.shields.io/badge/Human--in--the--Loop-Approval%20Gate-059669?style=flat-square" alt="Human-in-the-Loop"/>
</p>

<p align="center">
  <em>An autonomous multi-agent clinical documentation system built on the OpenAI Agents SDK. It ingests raw consultation transcripts, retrieves historical patient context via ChromaDB RAG, writes structured SOAP notes, constructs evidence-based treatment plans, schedules follow-ups, enforces human-in-the-loop review, and exports finalized PDF discharge summaries.</em>
</p>

---

## System Architecture

```
                                Consult Transcript & Patient ID
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 NOTWELL 6-AGENT PIPELINE                                    │
│                                                                                             │
│  ┌─────────────────────────┐      ┌─────────────────────────┐      ┌─────────────────────┐  │
│  │ 1. Patient History      │─────▶│ 2. Clinical Note Writer │─────▶│ 3. Medical Summary │  │
│  │    Agent                │      │    Agent                │      │    Agent            │  │
│  └───────────┬─────────────┘      └───────────┬─────────────┘      └──────────┬──────────┘  │
│              │                                │                               │             │
│              ▼                                ▼                               │             │
│         [ChromaDB RAG]                  [ICD-10 Lookup]                       │             │
│                                                                               │             │
│  ┌─────────────────────────┐      ┌─────────────────────────┐                 │             │
│  │ 6. Documentation        │◀─────│ 5. Follow-up           │◀────────────────┘             │
│  │    Reviewer Agent       │      │    Coordinator Agent    │                               │
│  └───────────┬─────────────┘      └───────────┬─────────────┘                               │
│              │                                │                                             │
│              ▼                                ▼                                             │
│      [Compliance Check]            [Calendar & Email API]                                   │
└──────────────┼──────────────────────────────────────────────────────────────────────────────┘
               │
               ▼
   ┌───────────────────────┐
   │  Human Approval Gate  │ ────▶ Clinician Approval / Edit / Rejection
   └───────────┬───────────┘
               │
               ▼
   ┌───────────────────────┐
   │ PDF Discharge Summary │ ────▶ Downloadable fpdf2 Document
   └───────────────────────┘
```

---

## Pipeline Modules

| # | Agent / Module | Trigger | Primary Function | Key Tools & Operations |
|---|----------------|---------|------------------|------------------------|
| **01** | 📜 Patient History Agent | Pipeline Start | Context Retrieval | Queries ChromaDB vector store for prior consultation records (`rag_search`) and builds patient longitudinal baseline |
| **02** | ✍️ Clinical Note Writer | Agent 01 Handoff | SOAP Note Generation | Structures chief complaint, S/O/A/P clinical findings, and resolves diagnosis codes (`icd10_lookup`) |
| **03** | 📋 Medical Summary Agent | Agent 02 Handoff | Executive Synthesis | Distills complex clinical narrative into key medical insights, critical symptoms, and risk factors |
| **04** | 💊 Treatment Planner Agent | Agent 03 Handoff | Care Plan Formulation | Generates pharmacological/non-pharmacological recommendations, checks drug safety (`medication_check`), and stratifies risk (`risk_scorer`) |
| **05** | 📅 Follow-up Coordinator | Agent 04 Handoff | Care Continuity | Auto-schedules return appointments (`appointment_scheduler`) and dispatches patient email notifications (`email_notifier`) |
| **06** | 🔍 Documentation Reviewer | Agent 05 Handoff | Quality & Compliance | Audits generated documentation for completeness, safety warnings, and flags items requiring clinician attention |
| **07** | 🛡️ Human Approval Gate | User Action | Clinician Verification | Pauses workflow for clinician review, allowing sign-off, modifications, or rejection before generating the final PDF |

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Agent Framework** | OpenAI Agents SDK (`openai-agents`) | Multi-agent handoff orchestration, tool binding, and dynamic routing |
| **LLM Inference** | Groq (`llama-3.3-70b-versatile`) + OpenRouter | Primary fast inference engine with automatic multi-key rate-limit fallback |
| **Vector Database** | ChromaDB | Local vector store for semantic retrieval of past patient consultations (RAG) |
| **API Framework** | FastAPI + Uvicorn | Async REST API endpoints for pipeline execution, patient management, and PDF streaming |
| **Database** | SQLite + SQLAlchemy | Persistent storage for patients, consultation sessions, and approval records |
| **Frontend UI** | Next.js 14 (App Router) + Tailwind CSS | Responsive 3-column clinical dashboard with Framer Motion animations |
| **PDF Generation** | `fpdf2` | Programmatic PDF layout generation for clinical discharge summaries |
| **Tool Integrations** | SendGrid API, ICD-10 Search, Risk Scorer | Automated external scheduling, notification, and clinical verification tools |

---

## Data Flow

The following sequence details how data flows through Notewell, highlighting agent handoffs, tool executions, vector RAG retrieval, and human-in-the-loop review.

```mermaid
flowchart TD
    subgraph ENTRY["📥 CLINICAL INPUT"]
        CLINICIAN["👨‍⚕️ Clinician / UI Client"]
        TRANSCRIPT["📄 Raw Consultation Transcript"]
        PATIENT_ID["🆔 Patient ID"]
    end

    subgraph API["🚀 API LAYER · FastAPI"]
        ENDPOINT["POST /api/consultations/run"]
        PIPELINE["⚙️ Pipeline Runner"]
    end

    subgraph AGENTS["🤖 6-AGENT PIPELINE · OpenAI Agents SDK"]
        A1["1️⃣ Patient History Agent"]
        A2["2️⃣ Clinical Note Writer Agent"]
        A3["3️⃣ Medical Summary Agent"]
        A4["4️⃣ Treatment Planner Agent"]
        A5["5️⃣ Follow-up Coordinator Agent"]
        A6["6️⃣ Documentation Reviewer Agent"]
    end

    subgraph TOOLS["🛠️ AGENT TOOLS & INTEGRATIONS"]
        T_RAG["🔍 rag_search\n(ChromaDB Vector Store)"]
        T_ICD["🏷️ icd10_lookup\n(Medical Taxonomy)"]
        T_MED["💊 medication_check\n(Drug Safety & Allergy)"]
        T_RISK["📊 risk_scorer\n(Clinical Risk Index)"]
        T_CAL["📅 appointment_scheduler\n(Calendar Integration)"]
        T_MAIL["📧 email_notifier\n(SendGrid API)"]
    end

    subgraph DB["💾 DATA LAYER · SQLite & Vector DB"]
        SQL_DB[("clinical_assistant.db\nPatients & Pipeline Runs")]
        CHROMA[("ChromaDB Store\nPatient Embedding History")]
    end

    subgraph APPROVAL["🛡️ HUMAN-IN-THE-LOOP"]
        GATE["⏸️ Human Approval Gate"]
        REVIEW["👤 Clinician Review / Edit / Approve"]
    end

    subgraph OUTPUT["📄 OUTPUT GENERATION"]
        PDF["🖨️ fpdf2 PDF Generator"]
        DISCHARGE["📥 Downloadable PDF Discharge Summary"]
    end

    CLINICIAN --> TRANSCRIPT
    CLINICIAN --> PATIENT_ID
    TRANSCRIPT --> ENDPOINT
    PATIENT_ID --> ENDPOINT
    ENDPOINT --> PIPELINE
    
    PIPELINE --> A1
    A1 <--> T_RAG
    T_RAG <--> CHROMA
    
    A1 -->|"Handoff (Context + History)"| A2
    A2 <--> T_ICD
    
    A2 -->|"Handoff (SOAP Note)"| A3
    
    A3 -->|"Handoff (Summary)"| A4
    A4 <--> T_MED
    A4 <--> T_RISK
    
    A4 -->|"Handoff (Care Plan)"| A5
    A5 <--> T_CAL
    A5 <--> T_MAIL
    
    A5 -->|"Handoff (Schedule & Email)"| A6
    A6 -->|"Final Evaluation"| GATE
    
    GATE --> REVIEW
    REVIEW -->|"Approved"| SQL_DB
    REVIEW -->|"Trigger PDF"| PDF
    PDF --> DISCHARGE
```

---

## Local Development

### Prerequisites

- **Python 3.11+**
- **Node.js 18+**
- API Keys: [Groq Console](https://console.groq.com/keys) · [OpenRouter](https://openrouter.ai/keys)

### 1. Repository Setup

```bash
git clone https://github.com/akshatbindal-075/Notwell
cd notewell
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
```

Configure your `.env` file:
```env
GROQ_API_KEY=gsk_your_primary_groq_key
OPENROUTER_API_KEY=sk-or-your_openrouter_key
ALLOWED_ORIGINS=http://localhost:3000
```

Start the backend service:
```bash
uvicorn app.main:app --reload --port 8000
# Backend API will be available at http://localhost:8000
```

### 3. Frontend Setup

In a new terminal:
```bash
cd frontend
npm install
cp .env.local.example .env.local
```

Configure `.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
```

Start the web application:
```bash
npm run dev
# Frontend interface will be live at http://localhost:3000
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/consultations/run` | Triggers the full 6-agent clinical execution pipeline |
| `GET` | `/api/consultations/{session_id}` | Polls real-time pipeline status and agent output logs |
| `POST` | `/api/consultations/{session_id}/approve` | Submits clinician human approval or feedback decision |
| `GET` | `/api/consultations/{session_id}/pdf` | Downloads the generated PDF discharge summary |
| `POST` | `/api/patients` | Registers a new patient record in SQLite |
| `GET` | `/api/patients/{patient_id}` | Retrieves demographic and clinical context for a patient |
| `GET` | `/api/patients/{patient_id}/visits` | Fetches historical visit logs and RAG availability status |
| `GET` | `/health` | Health check verification endpoint |

---

## Project Structure

```
notewell/
├── backend/
│   ├── app/
│   │   ├── agents/              # 6 OpenAI Agents SDK agent definitions
│   │   ├── api/
│   │   │   └── routes.py        # FastAPI API routes & endpoints
│   │   ├── db/
│   │   │   ├── database.py      # SQLAlchemy engine & session setup
│   │   │   └── models.py        # Patient, PipelineRun, & Approval ORM models
│   │   ├── models/
│   │   │   └── schemas.py       # Pydantic validation schemas
│   │   ├── services/
│   │   │   ├── pipeline_runner.py   # Multi-agent orchestrator & execution service
│   │   │   ├── structuring.py       # Free-text to Pydantic extraction engine
│   │   │   ├── approval_manager.py  # Human approval state machine
│   │   │   └── model_providers.py   # Groq / OpenRouter / Gemini LLM providers
│   │   ├── tools/               # 7 custom clinical tool implementations
│   │   ├── config.py            # Environment configuration loader
│   │   └── main.py              # FastAPI app initialization, middleware, & CORS
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
│
├── frontend/
│   ├── app/
│   │   ├── layout.js            # Root layout, Google Fonts, & metadata
│   │   ├── page.js              # Interactive 3-column clinical dashboard
│   │   └── globals.css          # Custom emerald/teal design system & styling
│   ├── components/
│   │   ├── AgentPipeline.js     # Live agent execution progress visualizer
│   │   ├── AgentOutputTabs.js   # Tabbed output inspector for all 6 agents
│   │   ├── PatientSidebar.js    # Patient history & RAG context sidebar
│   │   ├── ApprovalCard.js      # Interactive human approval card
│   │   ├── NewPatientForm.js    # Inline patient creation modal
│   │   └── Toast.js             # Notification banner component
│   ├── lib/
│   │   └── api.js               # Backend REST API client integration
│   ├── public/
│   │   ├── notewell-logo.png
│   │   └── screenshot.png
│   ├── tailwind.config.js
│   └── .env.local.example
│
├── .gitignore
└── README.md
```

---

## Environment Variables Reference

### Backend (`.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | ✅ | Primary Groq API key for Llama 3.3 70B inference |
| `GROQ_API_KEY_2` | Optional | Secondary Groq API key for automatic rate-limit fallback |
| `OPENROUTER_API_KEY` | ✅ | OpenRouter API key for fallback LLM routing |
| `GEMINI_API_KEY` | Optional | Google Gemini key for long-context operations |
| `DATABASE_URL` | Optional | Database connection URI (defaults to local SQLite) |
| `ALLOWED_ORIGINS` | ✅ | CORS allowed origins (e.g., `http://localhost:3000`) |
| `MODEL_FAST` | Optional | Override fast LLM model name |
| `SENDGRID_API_KEY` | Optional | SendGrid API key for patient follow-up emails |

### Frontend (`.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | ✅ | Base URL pointing to the FastAPI backend API |

---

## License

This project is licensed under the **MIT License**.
