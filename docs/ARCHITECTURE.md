# Architecture & Design Patterns — CarbonWise Platform

This document describes the design principles, system architecture, and emission model of the CarbonWise Carbon Footprint Awareness Platform.

## 📂 Project Structure

```
├── shared/                   # Shared TypeScript modules (isomorphic — used by both frontend & backend)
│   ├── types.ts              # Canonical interfaces (FootprintInputs, FootprintResult, ActionItem)
│   ├── factors.ts            # Emission conversion factors (UK DEFRA 2023, US EPA, IPCC)
│   ├── engine.ts             # Deterministic carbon footprint calculation engine
│   ├── ruleEngine.ts         # Offline rule-based insights fallback (when Gemini is unavailable)
│   └── index.ts              # Barrel re-exports
├── backend/                  # Node.js Express API (TypeScript)
│   ├── src/
│   │   ├── index.ts          # Server entrypoint — mounts API routes + serves static SPA
│   │   ├── config.ts         # Configuration loader (PORT, USE_GEMINI, USE_FIRESTORE, etc.)
│   │   ├── database.ts       # Firestore (cloud) / local JSON file (offline) repository
│   │   ├── carbon/           # Re-exports shared engine for backend use
│   │   ├── insights/
│   │   │   ├── gemini.ts     # Google Generative AI connection with multi-model waterfall
│   │   │   ├── cache.ts      # In-memory LRU cache with TTL for response deduplication
│   │   │   └── ruleEngine.ts # Re-exports shared rule engine for backend use
│   │   ├── routes/
│   │   │   └── carbon.ts     # REST endpoints: /calculate, /insights, /entries, /health
│   │   ├── middleware/
│   │   │   ├── security.ts   # Helmet CSP headers + JSON content-type enforcement
│   │   │   └── rateLimiter.ts # express-rate-limit for API and insights endpoints
│   │   ├── validation/
│   │   │   └── schemas.ts    # Zod schemas for all API request payloads
│   │   ├── utils/
│   │   │   ├── errors.ts     # Safe error message helper (hides internals in production)
│   │   │   └── paths.ts      # Frontend dist path resolver (dev vs compiled layouts)
│   │   └── tests/
│   │       ├── carbon.test.ts  # Engine, rule engine, and validation schema tests
│   │       ├── gemini.test.ts  # Gemini integration + fallback behavior tests
│   │       └── routes.test.ts  # HTTP route integration tests (ephemeral Express server)
│   ├── package.json
│   └── tsconfig.json
├── frontend/                 # React + TypeScript Vite SPA
│   ├── src/
│   │   ├── main.tsx          # React DOM entrypoint
│   │   ├── App.tsx           # Router, skip-link, status banners, layout shell
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx       # Hero + carbon footprint calculator form
│   │   │   ├── LandingPage.test.tsx  # DOM integration tests
│   │   │   └── ResultsPage.tsx       # Dashboard: breakdown, comparison, history, insights
│   │   ├── components/
│   │   │   ├── Navbar.tsx            # Sticky navigation bar
│   │   │   ├── ComparisonCard.tsx    # Paris target & global average comparison meters
│   │   │   ├── HistoryLog.tsx        # Emissions trend chart + saved entry list
│   │   │   └── InsightsPanel.tsx     # AI personalized recommendations grid
│   │   ├── store/
│   │   │   └── useCarbonStore.ts     # Zustand global state (calculate, save, history, insights)
│   │   ├── services/
│   │   │   └── api.ts                # Axios API client + type definitions
│   │   ├── lib/
│   │   │   ├── parseActionText.ts    # Parses AI action strings into heading/status/detail
│   │   │   ├── parseActionText.test.ts
│   │   │   └── engine.test.ts        # Shared engine edge-case tests
│   │   └── index.css                 # Design system (tokens, cards, animations, a11y)
│   ├── eslint.config.js
│   ├── vite.config.js
│   └── tsconfig.json
├── .github/workflows/ci.yml   # GitHub Actions: build, lint, test (both frontend & backend)
├── Dockerfile                  # Multi-stage build (React → TypeScript → Node alpine runner)
└── README.md
```

---

## ⚙️ Calculation Pipeline

Emissions calculations are implemented in `shared/engine.ts` and divided into four standard categories. All factors are defined in `shared/factors.ts` with inline source citations.

### 1. Transportation

| Input | Factor | Source |
|-------|--------|--------|
| `car_km_per_week × 52` | `0.170` (petrol), `0.171` (diesel), `0.120` (hybrid), `0.047` (electric) kg CO₂e/km | UK DEFRA 2023 |
| `motorcycle_km_per_week × 52` | `0.098` kg CO₂e/km | UK DEFRA 2023 |
| `transit_km_per_week × 52` | `0.060` kg CO₂e/km | UK DEFRA 2023 |
| `flights_short` (per year) | `1100 km × 0.158` = `173.8` kg CO₂e/flight | ICAO / DEFRA |
| `flights_long` (per year) | `6500 km × 0.150` = `975.0` kg CO₂e/flight | ICAO / DEFRA |

### 2. Home Energy

| Input | Factor | Source |
|-------|--------|--------|
| `electricity_kwh_per_month × 12` | `0.450` kg CO₂e/kWh (adjusted by `renewable_energy_pct`) | US EPA eGRID |
| `natural_gas_kwh_per_month × 12` | `0.183` kg CO₂e/kWh | IPCC |
| `heating_oil_kwh_per_month × 12` | `0.246` kg CO₂e/kWh | UK DEFRA 2023 |
| `lpg_kwh_per_month × 12` | `0.214` kg CO₂e/kWh | UK DEFRA 2023 |
| `water_m3_per_month × 12` | `0.344` kg CO₂e/m³ | UK Water / IPCC |

**Apportionment**: The sum of home energy emissions is divided by `household_size` to calculate the individual's share.

### 3. Diet Profile

| Diet Type | Annual kg CO₂e | Source |
|-----------|---------------|--------|
| Heavy meat | `3300` | Our World in Data |
| Medium meat | `2500` | Our World in Data |
| Low meat | `1900` | Climatic Change |
| Pescatarian | `1700` | Climatic Change |
| Vegetarian | `1500` | Climatic Change |
| Vegan | `1050` | Climatic Change |

### 4. Household Consumption

| Input | Factor | Source |
|-------|--------|--------|
| `shopping_spend_usd_per_month × 12` | `0.40` kg CO₂e/USD | US EPA / Carnegie Mellon EIO-LCA |
| `waste_landfill_kg_per_week × 52` | `0.580` kg CO₂e/kg (adjusted by `recycling_pct`) | IPCC Landfill Guidelines |

### Reference Targets

| Target | Value | Source |
|--------|-------|--------|
| Paris Sustainable Annual Target | `2,000` kg CO₂e/year (2.0 t) | Paris Agreement / IPCC |
| Global Average | `4,800` kg CO₂e/year (4.8 t) | Our World in Data |

---

## 🛡️ Robustness & AI Graceful Degradation

- The application uses the **Google Generative AI SDK** (`@google/generative-ai`) with `GEMINI_API_KEY` for authentication.
- The primary model is **Gemini 2.5 Flash** with a low temperature of `0.2` for high consistency and logical adherence. Responses are constrained via a strict JSON schema.
- If the primary model fails (quota, parsing, hallucination), the system automatically tries **Gemini 3.1 Flash** as a secondary model.
- If all AI models fail, it transparently falls back to the local `runRuleEngine()` deterministic fallback.
- The response payload is tagged with `source: 'gemini'` or `source: 'rules'` so the client can display the source transparently.
- An in-memory LRU cache with configurable TTL (default: 30 min, max 200 entries) prevents redundant API calls for identical user profiles.
