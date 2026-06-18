# 🌱 Carbon Footprint Awareness Platform

A web application that helps individuals understand, track, and reduce their personal carbon footprint through simple inputs and personalized, AI-generated insights.

Built as a single, accessible full-stack web application: a **Node.js / Express / TypeScript** backend and a **React + TypeScript** frontend, using **Google Gemini (Vertex AI)** for personalized advice and **Firestore** for tracking, deployed to Google Cloud Run as one container.

---

## 💡 Approach & Logic

### The decision flow (smart, context-driven assistant)

```text
User inputs (transport, home, diet, consumption)
        │
        ▼
Carbon engine  ──►  per-category kg CO₂e  ──►  ranked by size
        │                                          │
        ▼                                          ▼
Comparison to targets                  Insights generator
                                         ├─ Gemini (Vertex AI): tailored advice
                                         └─ Rule-based fallback: deterministic,
                                            targets the largest categories
        │
        ▼
Save snapshot (Firestore, keyed by anonymous device id) → history & trend
```

The "logical decision making based on user context" shows up in two critical places:

1. **The insights engine** ranks the user's own emission categories and gives advice for the biggest contributors — a heavy driver is told about transport; a heavy-meat eater is told about diet; each recommendation carries an estimated annual saving derived from that user's numbers.
2. **Graceful AI degradation.** Gemini produces the richest, most personal advice, but if it is unavailable (no credentials, quota, network, or disabled) the platform transparently falls back to a deterministic rule engine, so the user always gets useful, quantified guidance. The response is tagged with its source (`gemini` or `rules`).

### Emission model

Footprint figures use published emission factors (UK DEFRA 2023, US EPA, IPCC / Our World in Data) documented inline in `backend/src/carbon/factors.ts` — every constant cites its source rather than being a magic number. All quantities are normalised to annual kg CO₂e.

---

## 🏗️ How the solution works

### Architecture

```text
Browser (React + TS, Vite)              Cloud Run (single container)
  • accessible UI + bar chart  ──HTTP──► Node.js / Express (TypeScript)
  • anonymous device id (localStorage)    ├─ POST /api/calculate  pure carbon engine
                                          ├─ POST /api/insights   Gemini → rules fallback
                                          ├─ POST /api/entries    save snapshot
                                          ├─ GET  /api/entries/:id history
                                          └─ GET  /  (+ assets)   serves built SPA
                                              │
                                              ├─► Vertex AI (Gemini)  via ADC
                                              └─► Firestore (Native)  via ADC
```

One container serves both the API and the static SPA, so there is a single service to deploy and a single origin (no CORS in production). Authentication to Google services uses Application Default Credentials (the Cloud Run service account) — there are no API keys or secrets required in the repository for production deployment.

### Project layout

```text
backend/    Express app (TS) — carbon engine, insights, repository, routes, tests
frontend/   React + TS SPA — components, hooks, api client, accessible UI
docs/       Architecture notes (docs/ARCHITECTURE.md)
Dockerfile  multi-stage build (React build → TS compile → Node runtime)
```

See `docs/ARCHITECTURE.md` for the deeper architectural decisions and logic.

### Key endpoints

| Method & path | Purpose |
|---------------|---------|
| `POST /api/calculate` | Footprint breakdown for the supplied inputs |
| `POST /api/insights` | Personalized reduction advice (Gemini / rules) |
| `POST /api/entries` | Save a snapshot for an anonymous device |
| `GET /api/entries/:device_id` | List a device's history (newest first) |
| `GET /api/health` | Liveness/readiness probe |

---

## 🚀 Running Locally

### 1. Install Dependencies
```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

### 2. Configure Environment
Create a `.env` file in the `backend/` directory:
```env
PORT=5000
USE_GEMINI=true
GEMINI_API_KEY=your_api_key_here
USE_FIRESTORE=false
```
*(If `USE_FIRESTORE` is false, it falls back to a mock in-memory database)*

### 3. Start Development Servers
Start the backend API (Port 5000):
```bash
cd backend
npm run dev
```

Start the frontend Vite server (Port 3000):
```bash
cd frontend
npm run dev
```

Visit `http://localhost:3000` to use the application!