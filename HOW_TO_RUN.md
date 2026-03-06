# Agentic REEB AI — How to Run

## Quick Start (2 terminals)

### Terminal 1 — Backend

```bash
cd backend
python -m pip install -r requirements.txt   # first time only
python seed_data.py                          # first time only (adds demo clients)
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend runs at: **http://localhost:8000**
API docs (auto-generated): **http://localhost:8000/docs**

### Terminal 2 — Frontend

```bash
npm install        # first time only
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## Pages

| Route | Description |
|---|---|
| `/` | Home — marketing page with Live Demo CTA |
| `/features` | Features overview |
| `/industries` | Industries served |
| `/about` | About page (Mian Khizar, Meer Ali Abbas) |
| `/contact` | Contact form (saves to database) |
| `/demo` | **Live Demo** — webcam + face recognition + AI chat |
| `/admin` | Admin dashboard — stats, clients, messages, chat logs |
| `/register-client` | Register a client with face photo |

---

## Demo Flow for Committee Presentation

1. **Register yourself (admin):**
   - Go to `/admin` → click "Register Client"
   - Fill in your name + other details
   - Click "Use Camera", position your face, click "Capture"
   - Submit — your face descriptor is now saved

2. **Run the Live Demo:**
   - Go to `/demo`
   - Click "Start Camera"
   - When face detected (green indicator), click "Identify Me"
   - REEB greets you by name and shows your visit card
   - Chat with REEB about meetings, directions, etc.

3. **Show the Admin Dashboard:**
   - Go to `/admin`
   - Show the Overview stats (clients, visits, messages)
   - Show the Clients tab (with face-enabled clients)
   - Show the Chat Logs tab (logged conversations)

---

## Optional: Enable Real Claude AI

1. Copy `backend/.env.example` to `backend/.env`
2. Add your API key: `ANTHROPIC_API_KEY=sk-ant-...`
3. Restart the backend — REEB will now use Claude Haiku instead of rule-based responses

Without the API key, the rule-based engine handles all chat (works offline, no cost).

---

## Architecture

```
Frontend (React + Vite + face-api.js)
    │  Webcam → face-api.js computes 128D descriptor in browser
    │  Sends descriptor to backend for comparison
    │
    ▼
Backend (FastAPI + SQLite)
    │  /api/recognize  — compare descriptors (Euclidean distance, threshold 0.6)
    │  /api/chat       — AI receptionist (rule-based + optional Claude API)
    │  /api/clients    — CRUD + photo upload
    │  /api/contact    — contact form storage
    │  /api/admin      — stats and activity feed
    │
    ▼
Database: SQLite (reeb_ai.db)
    Clients | Visits | ChatLogs | ContactMessages
```
