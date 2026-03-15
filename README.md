# 🏗️ InfraPlan AI

**AI-Driven Infrastructure Project Execution Planning System**
Smart India Hackathon 2024 — Theme: Smart Infrastructure & Urban Management

> Scrapes real Indian government data → fine-tunes Phi-3 Mini 3.8B on Google Colab (free) → hosts on HuggingFace (free) → zero API costs forever.

---

## What It Does

InfraPlan AI helps government officials and citizens manage large-scale infrastructure projects. You describe a project, the AI decomposes it into a structured execution plan with phases, task dependencies, feasibility scoring, risk analysis, and weather impact assessment.

**Two portals:**
- **Admin** — create and manage projects, view task graphs, track budgets, predict delays, analyse weather risks
- **Citizen** — browse projects, view analysis and charts, ask questions about any project via AI chat

---

## Project Structure

```
infraplan2/
│
├── package.json                        ← root workspace (runs everything)
│
├── backend/
│   ├── server.js                       ← Express server (port 5001)
│   ├── package.json
│   ├── .env.example                    ← copy to .env
│   └── routes/
│       ├── model.js                    ← AI engine (Phi-3 / rule-based fallback)
│       ├── projects.js                 ← project CRUD
│       └── scraper.js                  ← gov data scraper endpoints
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── src/
│       ├── App.jsx                     ← routing + auth guards
│       ├── main.jsx                    ← entry point
│       ├── index.css                   ← global styles
│       ├── context/
│       │   └── AuthContext.jsx         ← login / logout / role
│       ├── store/
│       │   └── useStore.js             ← Zustand global state
│       ├── utils/
│       │   └── pdfExport.js            ← PDF export helper
│       ├── components/
│       │   ├── Layout.jsx              ← admin sidebar layout
│       │   ├── CitizenLayout.jsx       ← citizen top-navbar layout
│       │   └── ChatBot.jsx             ← floating AI chat widget
│       └── pages/
│           ├── Login.jsx               ← public (portal selector)
│           ├── admin/                  ← all admin-only pages
│           │   ├── Dashboard.jsx       ← project list + stats
│           │   ├── NewProject.jsx      ← AI plan generator form
│           │   ├── ProjectDetail.jsx   ← task management
│           │   ├── TaskGraph.jsx       ← ReactFlow dependency graph
│           │   ├── Analytics.jsx       ← Recharts dashboards
│           │   ├── BudgetTracker.jsx   ← budget vs actual
│           │   ├── DelayPrediction.jsx ← AI delay forecasting
│           │   ├── AdminMapView.jsx    ← projects on India SVG map
│           │   ├── AdminWeather.jsx    ← live weather + monsoon calendar
│           │   └── DataSources.jsx     ← training data pipeline UI
│           └── citizen/               ← all citizen-only pages
│               ├── CitizenHome.jsx     ← browse + search projects
│               ├── CitizenProject.jsx  ← project detail + AI chat
│               └── CitizenMapView.jsx  ← citizen map view
│
├── scraper/
│   ├── scrape.js                       ← scrapes data.gov.in, smartcities.gov.in
│   └── package.json
│
└── notebooks/
    └── finetune_phi3.ipynb             ← Google Colab fine-tuning notebook
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| State management | Zustand |
| Charts | Recharts |
| Dependency graph | ReactFlow |
| Auth | Context API + localStorage |
| Backend | Node.js + Express |
| AI engine | Phi-3 Mini 3.8B (fine-tuned) via HuggingFace |
| Fine-tuning | Unsloth + LoRA on Google Colab T4 GPU |
| Training data | data.gov.in, smartcities.gov.in, PMGSY |
| Weather | Open-Meteo API (free, no key needed) |
| HTTP client | Axios |
| Cost | ₹0 |

---

## Setup — Step by Step

### Prerequisites
- Node.js 18+ → nodejs.org
- VSCode → code.visualstudio.com
- No API key needed to start

### 1. Open project
```bash
code infraplan2
```

### 2. Create backend .env
```bash
cd backend
cp .env.example .env
```

Default `.env` works immediately — no changes needed:
```
PORT=5001
FRONTEND_URL=http://localhost:5173
# HF_MODEL_URL=   ← add after fine-tuning (optional)
# HF_TOKEN=       ← add after fine-tuning (optional)
```

### 3. Install dependencies
```bash
# from root infraplan2/ folder
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### 4. Run
```bash
npm run dev
```

Opens on **http://localhost:5173**

---

## Demo Credentials

| Portal | Username | Password | Role |
|---|---|---|---|
| Administrator | `admin` | `sih2024` | Full access |
| Administrator | `engineer1` | `infra123` | Full access |
| Citizen | `citizen` | `citizen123` | Read-only |
| Citizen | `demo` | `demo` | Read-only |

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check + engine status |
| GET | `/api/model/status` | AI engine info (phi3 vs rule-based) |
| POST | `/api/model/decompose` | Generate AI execution plan |
| POST | `/api/model/chat` | InfraBot chat |
| GET | `/api/projects` | List all projects |
| POST | `/api/projects` | Save a project |
| GET | `/api/projects/:id` | Get project by ID |
| PUT | `/api/projects/:id` | Update project |
| PATCH | `/api/projects/:id/tasks/:taskId` | Update task status/progress |
| DELETE | `/api/projects/:id` | Delete project |
| GET | `/api/scraper/status` | Scraper status |
| GET | `/api/scraper/collect` | Scrape government data |
| GET | `/api/scraper/projects` | List scraped projects |
| GET | `/api/scraper/training-data` | Download JSONL for fine-tuning |

---

## AI Engine — Two Modes

The app works immediately without any setup using the **built-in rule engine**. The sidebar shows which engine is active.

| Mode | Sidebar label | How to activate |
|---|---|---|
| Rule-based engine | `Rule Engine` 🟡 | Default — works out of the box |
| Fine-tuned Phi-3 | `Phi-3 Live` 🟢 | Complete the steps below |

### Upgrading to Phi-3 (free, ~25 minutes)

**Step 1 — Collect training data**
```bash
cd scraper
npm install
node scrape.js
# creates training_data.jsonl
```
Or download it from the app's **Data Sources** page.

**Step 2 — Fine-tune on Google Colab**
1. Go to colab.research.google.com
2. Upload `notebooks/finetune_phi3.ipynb`
3. Runtime → Change runtime type → **T4 GPU** (free)
4. Run all cells (~20 min)
5. Upload `training_data.jsonl` when prompted
6. Paste your HuggingFace token (huggingface.co/settings/tokens)

**Step 3 — Connect to the app**

The notebook prints your model URL. Add it to `backend/.env`:
```
HF_MODEL_URL=https://api-inference.huggingface.co/models/YOUR_USERNAME/infraplan-phi3
HF_TOKEN=hf_your_token_here
```

Restart backend → sidebar shows **Phi-3 Live** ✅

---

## Features

### Admin Portal
- **Dashboard** — all projects, stats, feasibility scores, delete/manage
- **New Project** — describe a project, AI generates full execution plan in seconds
- **Project Detail** — manage tasks, update status, drag progress slider per task
- **Task Graph** — interactive ReactFlow node graph showing all task dependencies and critical path
- **Analytics** — bar charts, pie charts, radar charts across all projects
- **Budget Tracker** — phase-wise budget vs actual spend
- **Delay Prediction** — AI forecasts if project will finish on time
- **Map View** — all projects plotted on SVG map of India, click for details
- **Weather Risk** — live weather (Open-Meteo) + monsoon calendar + flags weather-sensitive tasks
- **Data Sources** — scraped government project data, export training JSONL

### Citizen Portal
- **Home** — browse and search all projects with feasibility and progress indicators
- **Project Detail** — full read-only analysis with charts, phase timeline, risks, and per-project AI chat
- **Map View** — India map with project markers and progress rings

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Port 5000 in use | Change `PORT=5001` in `backend/.env` |
| `npm install` fails | Run `npm install --legacy-peer-deps` |
| HF model times out | Cold start takes ~30s. App auto-falls back to rule engine |
| Blank page | Make sure backend is running on its port |
| `AuthContext not found` | Check import path uses `../../context/` from inside `pages/admin/` |

---

*Built for Smart India Hackathon 2024*
