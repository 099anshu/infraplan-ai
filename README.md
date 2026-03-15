# 🏗️ InfraPlan AI
### AI-Driven Infrastructure Project Execution Planning System
**SIH 2024 — Smart Infrastructure & Urban Management**

> Scrapes real Indian government data → fine-tunes Phi-3 Mini on Google Colab (free) → hosts on HuggingFace (free) → runs in your app. Zero API costs.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    DATA PIPELINE                         │
│                                                          │
│  data.gov.in ──┐                                         │
│  smartcities ──┼──► scraper/scrape.js ──► training.jsonl │
│  pmgsy.gov.in ─┘                                         │
│                         │                                │
│                         ▼                                │
│              notebooks/finetune_phi3.ipynb               │
│              (Google Colab T4 GPU — FREE)                │
│                         │                                │
│                         ▼                                │
│              HuggingFace Hub (FREE hosting)              │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼ HF_MODEL_URL in .env
┌─────────────────────────────────────────────────────────┐
│                    APP STACK                             │
│                                                          │
│  React + Vite (port 5173) ◄──► Express (port 5000)      │
│  • Dashboard              │    • /api/model/decompose    │
│  • New Project form       │    • /api/model/chat         │
│  • Task management        │    • /api/scraper/collect    │
│  • ReactFlow graph        │    • /api/projects CRUD      │
│  • Analytics charts       │                              │
│  • Data Sources page      │    ▲ calls HuggingFace API   │
│  • InfraBot chat          │    ▲ falls back to rule-based │
└─────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
infraplan-ai/
├── package.json                 ← Root workspace (runs everything)
│
├── backend/
│   ├── package.json
│   ├── server.js                ← Express server
│   ├── .env.example             ← Copy to .env
│   └── routes/
│       ├── model.js             ← HuggingFace + rule-based fallback
│       ├── projects.js          ← Project CRUD
│       └── scraper.js           ← Gov data scraper endpoints
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── App.jsx
│       ├── index.css
│       ├── store/useStore.js    ← Zustand state
│       ├── components/
│       │   ├── Layout.jsx       ← Sidebar nav
│       │   └── ChatBot.jsx      ← Floating AI chat
│       └── pages/
│           ├── Dashboard.jsx    ← Project list
│           ├── NewProject.jsx   ← Generate plan form
│           ├── ProjectDetail.jsx← Task management
│           ├── TaskGraph.jsx    ← ReactFlow graph
│           ├── Analytics.jsx    ← Recharts dashboards
│           └── DataSources.jsx  ← Training pipeline UI
│
├── scraper/
│   ├── package.json
│   └── scrape.js               ← Standalone scraper script
│
└── notebooks/
    └── finetune_phi3.ipynb     ← Google Colab fine-tuning
```

---

## VSCode Setup — Step by Step

### Prerequisites
- **Node.js 18+** — https://nodejs.org
- **VSCode** — https://code.visualstudio.com
- No API key needed! App works immediately with built-in rule engine.

---

### Step 1 — Open in VSCode

Unzip the project, then:
```bash
code infraplan-ai
```
Or: **File → Open Folder** → select `infraplan-ai/`

---

### Step 2 — Create backend .env

Open VSCode terminal with `` Ctrl+` ``:

```bash
cd backend
cp .env.example .env
```

The default `.env` works immediately — no changes needed to start:
```
PORT=5000
FRONTEND_URL=http://localhost:5173
# HF_MODEL_URL= ← add after fine-tuning (optional)
```

---

### Step 3 — Install all dependencies

```bash
# From the root infraplan-ai/ folder:
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

---

### Step 4 — Run the app

```bash
# From root — starts both servers:
npm run dev
```

Or run separately:
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

Open **http://localhost:5173** ✅

---

## The App Works Immediately

Without any fine-tuning, the app uses the **built-in rule engine** which:
- Knows real phase structures for 10+ Indian infrastructure project types
- Generates realistic task dependencies, costs, timelines
- Provides risk analysis based on common Indian infrastructure challenges
- Handles Road, Metro, Water, Smart City, Energy project types

The engine label in the sidebar shows `Rule Engine` (amber) vs `Phi-3 Live` (green).

---

## Upgrading to Phi-3 Fine-tuned Model (Zero Cost)

### Part A — Collect training data

```bash
cd scraper
npm install
npm run scrape
# → creates training_data.jsonl (~35 pairs from 3 govt sources)
```

Or just download it from the app's **Data Sources** page.

### Part B — Fine-tune on Google Colab

1. Go to **colab.research.google.com**
2. Upload `notebooks/finetune_phi3.ipynb`
3. Runtime → Change runtime type → **T4 GPU** (free tier)
4. Run all cells in order
5. When prompted: upload `training_data.jsonl` and paste your HuggingFace token
   - Get token from: **huggingface.co/settings/tokens** (free account)

Training takes ~15–25 minutes. The notebook:
- Loads Phi-3 Mini 3.8B using Unsloth (fits in free T4 GPU)
- Fine-tunes with LoRA (only trains small adapter layers)
- Pushes your model to HuggingFace automatically

### Part C — Connect to app

The notebook prints your model URL. Add it to `backend/.env`:

```bash
HF_MODEL_URL=https://api-inference.huggingface.co/models/YOUR_USERNAME/infraplan-phi3
HF_TOKEN=hf_your_token_here
```

Restart the backend:
```bash
# In the backend terminal: Ctrl+C, then:
npm run dev
```

The sidebar now shows **Phi-3 Live** ✅

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check + engine status |
| POST | `/api/model/decompose` | Generate AI execution plan |
| POST | `/api/model/chat` | InfraBot chat |
| GET | `/api/model/status` | Engine status (phi3 vs rule-based) |
| GET | `/api/scraper/collect` | Scrape govt data |
| GET | `/api/scraper/training-data` | Download .jsonl for fine-tuning |
| GET | `/api/scraper/projects` | List scraped projects |
| GET | `/api/projects` | List saved projects |
| POST | `/api/projects` | Save project |
| PATCH | `/api/projects/:id/tasks/:tid` | Update task status |
| DELETE | `/api/projects/:id` | Delete project |

---

## Recommended VSCode Extensions

- **ESLint** `dbaeumer.vscode-eslint`
- **Prettier** `esbenp.prettier-vscode`
- **Tailwind IntelliSense** `bradlc.vscode-tailwindcss`
- **ES7 React Snippets** `dsznajder.es7-react-js-snippets`

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Port 5000 in use | Change `PORT=5001` in `.env`, update `vite.config.js` proxy target |
| `npm install` fails | Add `--legacy-peer-deps` flag |
| HF model times out | First call is slow (cold start ~30s). App auto-retries with rule engine |
| Blank frontend | Check backend is running on port 5000 |
| Scraper returns empty | data.gov.in may be slow; app uses fallback data automatically |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind |
| State | Zustand |
| Charts | Recharts |
| Graph | ReactFlow |
| Backend | Node.js + Express |
| AI Model | Phi-3 Mini 3.8B (fine-tuned) via HuggingFace |
| Fine-tuning | Unsloth + LoRA on Google Colab T4 GPU |
| Data | data.gov.in, smartcities.gov.in, PMGSY |
| HTTP | Axios |
| Cost | ₹0 |

---

*Smart India Hackathon 2024 — Smart Infrastructure & Urban Management*
