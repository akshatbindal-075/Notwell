# Project Log — AI Clinical Documentation Assistant

> **Purpose of this file:** This is the single source of truth for the project. If the conversation/session ends or credits run out, paste this entire file into a new Claude conversation along with the instruction: "Continue this project from where PROJECT_LOG.md left off." Every instruction given and every piece of work completed will be appended here, in order, with timestamps (session-relative, not wall-clock).

---

## 1. Problem Statement (as given by user)

Create an AI assistant that helps healthcare professionals summarise consultations, prepare clinical notes, organise patient history, generate discharge summaries, and recommend follow-up actions while maintaining structured medical documentation.

**Hard requirements:**
- Built using **OpenAI Agents SDK**
- No OpenAI API key available — must use **Groq, Gemini, and OpenRouter** keys instead (via LiteLLM / OpenAI-compatible endpoints)
- **Minimum 5 agents**, suggested list:
  - Patient History
  - Clinical Note Writer
  - Medical Summary
  - Treatment Planner
  - Follow-up Coordinator
  - Documentation Reviewer
- **Minimum 5 tools/APIs**
- Must include: **agent handoffs, memory/context management, structured outputs, human approval (where applicable)**
- **Optional/advanced features** (nice to have): planning & reasoning, RAG/knowledge retrieval, long-term memory, reflection/self-review, parallel agent execution, error handling & logging, multi-modal inputs, session persistence

**Deployment intent:**
- Frontend: JavaScript (Next.js/React) → deploy on **Vercel**
- Backend: Python → deploy on **Render** or **Railway**

---

## 2. Instructions Log (chronological)

1. **[Instruction]** User gave the problem statement above and asked for a full industry-ready project plan.
   **[Response]** Claude proposed architecture: FastAPI + openai-agents SDK backend on Railway, Next.js frontend on Vercel, Postgres + pgvector for memory/RAG. Proposed 6 agents (added Orchestrator), 7 tools. Mapped all hard requirements to SDK features (handoffs, Session, Pydantic structured outputs, human-approval pause/resume pattern). Recommended Railway over Render for WebSocket/background-task support. Asked user whether to scaffold backend first or lay out repo structure/README first.

2. **[Instruction]** User said more instructions are coming; will give the "start" command themselves once ready. **No build work requested yet.**
   **[Response]** Claude acknowledged, took no action.

3. **[Instruction]** User asked Claude to maintain a log file of all instructions and work done, so progress can be resumed by a different Claude session/agent if credits run out.
   **[Response]** Claude created `/home/claude/clinical-ai-project/PROJECT_LOG.md` (this file). Will append to it after every subsequent instruction and every unit of work completed. Nothing has been built yet — still waiting on user's remaining instructions and their explicit "start" command.

4. **[Instruction]** User uploaded a reference image (`wave-haikei.png`) — a wave-divider graphic in cool gray (top) and solid blue (bottom) — and asked to (a) use this color scheme throughout the software, and (b) use **Motion Primitives** (Framer-Motion-based component library) in the frontend.
   **[Response]** Claude acknowledged and logged the design direction:
   - **Palette:** neutral/cool gray (~`#C4C4C4` light surface, darker grays for text/borders) as the base, with solid blue (~`#2B93D1`) as the primary/accent color.
   - **Motif:** wave-divider SVG shape to be used as a recurring section-break/visual element in the UI (e.g., dashboard header, section transitions).
   - **Frontend animation library:** Motion Primitives (built on Framer Motion) for transitions — e.g. agent handoff state changes, approval-card animations, streaming text reveals.
   - No build work done yet — still awaiting user's remaining instructions and explicit "start" command.

---

5. **[Instruction]** User said "Now you can Continue" — explicit start command given.
   **[Response]** Claude began full build, backend first.

## 3. Work Completed So Far

- [x] Project directory created: `/home/claude/clinical-ai-project/`
- [x] `PROJECT_LOG.md` initialized
- [x] Repo scaffolding — `backend/app/{models,db,services,tools,agents,api}` + `frontend/{app,components,lib}`
- [x] **Backend fully built** (all files syntax-checked with `py_compile`, 0 errors):
  - `app/config.py` — env-based settings, no OpenAI key required
  - `app/services/model_providers.py` — Groq/OpenRouter/Gemini wired as OpenAI-compatible clients via `OpenAIChatCompletionsModel`
  - `app/models/schemas.py` — Pydantic structured-output schemas for every agent + `PipelineResult` bundle
  - `app/db/models.py` + `database.py` — SQLAlchemy: Patient, Visit, PipelineRun, ApprovalRecord
  - **7 tools**: patient_db_tool, rag_tool (chromadb), transcription_tool (Groq Whisper), pdf_tool (fpdf2), icd10_tool (free NLM API), calendar_tool, notification_tool (SendGrid w/ demo fallback)
  - **6 agents**, each with structured `output_type` + assigned model (Groq/Gemini/OpenRouter): Patient History, Clinical Note Writer (SOAP), Medical Summary, Treatment Planner, Follow-up Coordinator, Documentation Reviewer (reflection/self-review, always requires human approval)
  - `agents/orchestrator.py` — chains all 6 agents via native SDK `handoff()`
  - `services/session_manager.py` — SDK `SQLiteSession` short-term memory; long-term via DB + RAG
  - `services/pipeline_runner.py` — runs chain, per-run error handling/logging, DB persistence
  - `services/approval_manager.py` — human-in-the-loop approve/reject logic
  - `api/routes.py` + `main.py` — FastAPI app with all endpoints
  - `requirements.txt`, `.env.example`, `Dockerfile`, `railway.json` — ready for Railway
- [ ] Frontend (Next.js, JS, gray/blue wave theme + Motion Primitives) — **in progress**
- [ ] Vercel deployment config — **not started**
- [ ] Root README — **not started**

---

## 4. Current State / Next Action

**In progress:** Building the Next.js frontend (JavaScript) with the gray/blue wave-divider color scheme and Motion Primitives animations.

**Next step:** Finish frontend components, wire to backend API, add Vercel config, write root README, zip and deliver full repo.

## 5. Open Questions / Decisions Not Yet Locked In

- Backend host: Railway (recommended) vs Render — awaiting final confirmation
- Whether to include parallel agent execution / true long-term memory (currently marked as lower priority/optional)
- Specific models to pin per agent (Groq Llama 3.3 vs OpenRouter free-tier model choices)
- DB choice confirmation: Postgres + pgvector

---

*This file will be updated continuously as the project progresses. Always check Section 4 first to see what's next.*
