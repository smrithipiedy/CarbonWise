# Architecture & Design Patterns — Carbon Footprint Platform

This document describes the design principles and system architecture of the Carbon Footprint Awareness Platform.

## 📂 Project Structure

The project is structured to compile, test, and containerize the entire application in a single deployment footprint:

```
├── backend/                  # Node.js Express API gateway & engine (TypeScript)
│   ├── src/
│   │   ├── carbon/           # Calculation engine and standards conversion factors
│   │   │   ├── factors.ts    # Standard conversion factors (IPCC, DEFRA, US EPA)
│   │   │   └── engine.ts     # Clean math calculation rules
│   │   ├── database.ts       # Firestore native service and offline memory repository
│   │   ├── config.ts         # Configuration loader (USE_GEMINI, USE_FIRESTORE flags)
│   │   ├── insights/         # Google Gen AI recommendations & fallback engine
│   │   │   └── gemini.ts     # Gemini AI connection and fallback actions logic
│   │   ├── routes/           # Express REST endpoints
│   │   │   └── carbon.ts
│   │   ├── tests/            # Automated test suite
│   │   │   └── test_endpoints.ts
│   │   └── index.ts          # Server entrypoint and single-origin static routing
│   ├── package.json
│   └── tsconfig.json
├── frontend/                 # React TS Vite single page application
│   ├── src/
│   │   ├── services/         # Axios API connection layer
│   │   ├── store/            # Zustand global state store
│   │   ├── pages/            # LandingPage, Home calculator form, and ResultsPage analytics dashboard
│   │   └── components/       # Navbars and visual components
│   └── tsconfig.json
├── Dockerfile                # Multi-stage build (React build -> TypeScript compiler -> Node.js alpine runner)
└── README.md
```

---

## ⚙️ Calculation Pipeline

Emissions calculations are divided into four standard categories:

1. **Transportation**:
   - `car_km` * `0.17` (UK DEFRA 2023 petrol average)
   - `bus_km` * `0.09` (UK DEFRA 2023 local bus average)
   - `train_km` * `0.035` (UK DEFRA 2023 rail average)
   - `flights_short` * `75.0` (representative regional domestic flight)
   - `flights_long` * `1140.0` (representative transcontinental flight)

2. **Home Energy**:
   - `electricity` * `0.38` (US EPA grid average)
   - `natural_gas` * `1.93` (IPCC average)
   - `heating_oil` * `2.68` (UK DEFRA/US EPA average)
   - **Apportionment**: The sum of energy emissions is divided by `household_size` to calculate the individual's share.

3. **Diet Profile**:
   - `meat` = `2050 kg CO2e` (Our World in Data high-meat average)
   - `vegetarian` = `1100 kg CO2e` (Climatic Change average)
   - `vegan` = `750 kg CO2e` (Climatic Change plant-based average)

4. **Household Consumption**:
   - `shopping_spend_usd` * `0.12` (US EPA / Carnegie Mellon EIO-LCA)
   - `waste_landfill_kg` * `0.50` (IPCC Landfill Methane Emission Guidelines)

---

## 🛡️ Robustness & AI Graceful Degradation

- When `USE_GEMINI=true` and `GEMINI_API_KEY` is present, the app calls Google Gen AI (Gemini 1.5 Flash) with strict JSON schema instructions and a low temperature (`0.4`).
- If any connection error, quota restriction, or parsing issue occurs, it transparently drops back to the local `runRuleEngine()` fallback.
- The payload returned is tagged with `source: gemini` or `source: rules` so the client can display the source transparently.
