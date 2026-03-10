# REEB AI — Intelligent Receptionist System

An AI-powered receptionist demo built as a Final Year Project (FYP). REEB AI greets visitors via webcam, recognizes registered clients using face recognition, handles natural language conversations, and autonomously schedules meetings — all without human intervention.

---

## Features

- **Face Recognition** — Browser-based face detection and recognition using `face-api.js` (`@vladmandic/face-api`). No data sent to third-party servers.
- **AI Conversation** — Claude Sonnet 4.6 (Anthropic) powers a natural, human-like receptionist chat with rule-based fallback.
- **Meeting Scheduling** — Visitors can book meetings through conversation. The AI parses intent and books directly into the database.
- **Email Confirmations** — Automated confirmation emails sent to both the visitor and the host via Gmail SMTP.
- **Admin Dashboard** — Manage clients, view meetings on a calendar, read chat logs, and handle contact messages.
- **Client Registration** — Register clients with a face capture from webcam; face descriptors are stored securely.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vite + React 18 + TypeScript + TailwindCSS + shadcn/ui |
| Backend | FastAPI (Python 3.12+) + SQLAlchemy + SQLite |
| Face Recognition | face-api.js / @vladmandic/face-api (browser-side) |
| AI Chat | Claude Sonnet 4.6 via Anthropic API |
| Email | Gmail SMTP via Python `smtplib` |
| Deployment | Vercel (frontend) + Railway (backend) |

---

## Project Structure

```
reeb-receptionist-ai/
├── backend/
│   ├── main.py                 # FastAPI app entry point
│   ├── models.py               # SQLAlchemy models (Client, Visit, Meeting, etc.)
│   ├── database.py             # DB session setup
│   ├── seed_data.py            # Demo data seeder
│   ├── requirements.txt        # Python dependencies
│   ├── .env.example            # Environment variable template
│   ├── routes/
│   │   ├── clients.py          # Client CRUD + face registration
│   │   ├── recognize.py        # Face recognition endpoint
│   │   ├── chat.py             # AI chat + meeting booking
│   │   ├── meetings.py         # Meetings CRUD + availability
│   │   ├── admin.py            # Admin dashboard data
│   │   └── contact.py          # Contact form
│   └── services/
│       ├── ai_service.py       # Claude Sonnet 4.6 + rule-based fallback
│       └── email_service.py    # Gmail SMTP email sender
├── src/
│   ├── pages/
│   │   ├── Demo.tsx            # Main receptionist UI (webcam + chat)
│   │   ├── Admin.tsx           # Admin dashboard
│   │   ├── RegisterClient.tsx  # Client face registration
│   │   └── ...
│   ├── components/             # Reusable UI components
│   └── api/
│       └── apiClient.ts        # Axios API client
├── public/                     # Static assets + face-api.js models
├── vercel.json                 # Vercel SPA routing config
└── railway.json                # Railway start command config
```

---

## Getting Started

### Prerequisites

- Node.js v18+ and npm
- Python 3.12+
- An [Anthropic API key](https://console.anthropic.com)
- A Gmail account with an [App Password](https://support.google.com/accounts/answer/185833)

### 1. Clone the repository

```bash
git clone https://github.com/AhmadShayan/reeb-receptionist-ai.git
cd reeb-receptionist-ai
```

### 2. Set up the backend

```bash
cd backend
pip install -r requirements.txt

# Create your environment file from the template
cp .env.example .env
# Edit .env and fill in your API keys
```

### 3. Set up the frontend

```bash
# From the project root
npm install

# Create a frontend env file
echo "VITE_API_BASE_URL=http://localhost:8000" > .env.local
```

### 4. Run locally

```bash
# Terminal 1 — Backend (port 8000)
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 — Frontend (port 5173)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key |
| `GMAIL_USER` | Gmail address used to send emails |
| `GMAIL_APP_PASSWORD` | 16-character Gmail App Password |
| `RECEPTIONIST_EMAIL` | Email that receives meeting notifications |
| `FRONTEND_URL` | Frontend origin for CORS (e.g. your Vercel URL) |

### Frontend (`.env.local`)

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend API base URL (e.g. your Railway URL) |

---

## Deployment

### Frontend — Vercel

1. Connect the repository to [Vercel](https://vercel.com)
2. Set environment variable: `VITE_API_BASE_URL` = your Railway backend URL
3. Deploy — Vercel auto-deploys on every push to `main`

### Backend — Railway

1. Connect the repository to [Railway](https://railway.app)
2. Set all backend environment variables in the Railway dashboard
3. Set `FRONTEND_URL` = your Vercel frontend URL (for CORS)
4. Railway uses `railway.json` for the start command

---

## How It Works

1. **Visitor arrives** → webcam activates on the Demo page
2. **Face detection** → `face-api.js` computes a 128-dimensional face descriptor in the browser
3. **Recognition** → descriptor is sent to `/api/recognize/` where the backend compares it against registered clients using Euclidean distance (threshold 0.6)
4. **AI conversation** → Claude Sonnet 4.6 greets the visitor by name (or as a guest) and handles any queries
5. **Meeting booking** → when the visitor requests a meeting, the AI embeds a `[SCHEDULE:{...}]` marker in its response; the backend parses this, saves the meeting, and sends confirmation emails to both parties
6. **Admin review** → staff can view all meetings, clients, chat logs, and contact messages in the Admin dashboard

---

## Database Models

| Model | Purpose |
|-------|---------|
| `Client` | Registered clients with name, email, face descriptor |
| `Visit` | Log of every face-recognition visit |
| `Meeting` | Scheduled meetings with date, time, host, status |
| `ChatLog` | Full conversation history per session |
| `ContactMessage` | Messages submitted via the Contact form |

---

## Security Notes

- All credentials are loaded from environment variables — never hardcoded
- Face descriptors are 128-dimensional float arrays (not raw images) stored in the database
- The `backend/.env` file and SQLite database are excluded from version control via `.gitignore`
- Client face photos in `backend/uploads/` are excluded from version control

---

## License

This project is built for academic/demonstration purposes as a Final Year Project (FYP).
