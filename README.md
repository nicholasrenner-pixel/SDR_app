# Prospecting Engine (Deel Outbound Edition)

> **Production-Grade B2B Outbound SDR Qualification Workstation for Deel**  
> *Proof of work for SDR job interviews — 100% locally hosted, zero external API keys, zero hallucinations.*

Prospecting Engine is built for an outbound Sales Development Representative (SDR) qualifying B2B accounts across **Deel's core product suite**:
- **Deel EOR (Employer of Record)**: Compliantly hire and onboard full-time international employees in 90+ countries in days without local entities.
- **Deel Contractor Management & Deel Shield**: Onboard, pay, and legally insulate international contractors against statutory misclassification liability.
- **Deel Global Payroll**: Consolidate fragmented multi-country payroll providers into a single unified platform.
- **Deel HR & Immigration**: Manage global mobility, international visa sponsorships, localized equipment, and HR administration.

---

## Core Capabilities & Features

### 1. Executive Dashboard & Pipeline Analytics
- **Top KPI Strip**: Real-time counters for *Total Accounts*, *Hot Priority (Score 75+)*, *Meetings Booked*, and *Follow-Ups Due Today*.
- **Interactive Recharts**:
  - *Accounts by Status*: Stage distribution (`New`, `Ready`, `Contacted`, `Replied`, `Meeting`).
  - *Accounts by Temperature*: Categorical distribution (`HOT`, `WARM`, `COLD`, `DISQUALIFIED`).
  - *Pipeline Funnel Conversion*: Step-by-step conversion percentages (`Accounts -> Ready -> Contacted -> Replied -> Meeting`).
- **Searchable & Filterable Table**: Real-time search across company, industry, and contact names; filter pills by status and temperature; and an active **"Due Today"** toggle.
- **Sample Data Management**: One-click **"Delete Sample Data"** button wipes pre-seeded demo accounts instantly, with a restore button available anytime.

### 2. "3x3" Research Timer (`/accounts/new`)
- Integrated **3:00 Countdown Timer** (Start / Pause / Reset) directly in the Add Account header so SDRs can practice the 3x3 prospecting rule (extract 3 relevant facts in 3 minutes).
- Automatically scans pasted research notes for key terms and suggests matching buying signals upon account creation.

### 3. Deterministic Deel Scoring & Product Routing Engine (`/backend/scoring.py`)
- **Headcount Base (Up to 20 pts)**:
  - `51–200` or `201–1,000` employees: `+20 pts` (Deel EOR & Global Payroll sweet spot)
  - `1–50` employees: `+15 pts` (Contractor & early EOR)
  - `1,001–5,000` employees: `+10 pts` (Global Payroll entity consolidation)
  - `5,000+` employees: `+5 pts`
- **6 Positive Deel Buying Signals**:
  1. `remote_global_hiring`: Hiring remote roles outside HQ country (`+25 pts` -> `Deel EOR`)
  2. `recent_funding`: Recent funding round / international expansion (`+20 pts` -> `Deel EOR & Contractor`)
  3. `contractor_misclassification`: Heavy contractor headcount / misclassification risk (`+20 pts` -> `Deel Contractor & Shield`)
  4. `fragmented_payroll`: Operating 3+ fragmented local payroll providers (`+20 pts` -> `Deel Global Payroll`)
  5. `first_global_hr_hire`: Hiring first People Ops / Global Mobility role (`+15 pts` -> `Deel HR & Immigration`)
  6. `cross_border_ma_visa`: Cross-border M&A or employee visa relocation (`+15 pts` -> `Deel Immigration & EOR`)
- **3 Red Flag Disqualification Checks**:
  1. `domestic_only`: Strict domestic / on-site-only hiring policy (`-30 pts`)
  2. `hiring_freeze`: Active company-wide hiring freeze or layoffs (`-25 pts`)
  3. `legacy_lock_in`: Enterprise locked into multi-year Workday/ADP contracts (`-20 pts`)
- **Temperature & Routing**:
  - Raw score `< 25` with red flags (or `domestic_only` with 0 positive signals) sets temperature to `'DISQUALIFIED'`.
  - Otherwise: `HOT (75+)`, `WARM (45–74)`, `COLD (<45)`.
  - Automatically routes to the highest-weighted active positive signal.

### 4. Zero-Hallucination Grounded Brief Generator (`/backend/brief_generator.py`)
- Strictly parses exact sentences, quotes, roles, and countries from pasted `research_notes`.
- **Strict Grounding Rule**: If facts are missing for any section, the engine explicitly outputs `"Not in notes"`.
- Persona-tailored outreach matrix:
  - **VP of People / Talent**: Speed of international hiring (days vs. months for entity setup) and localized benefits.
  - **CFO / Finance**: Eliminating $50k+ entity setup/maintenance costs, avoiding contractor misclassification fines via Deel Shield, and consolidated invoices.
  - **General Counsel / Payroll**: 130+ owned entities, local labor law compliance, IP assignment, and SOC 2 / GDPR security.
- Outputs 3 grounded first lines, 5 discovery questions, 3 objection rebuttals, a 30-second talk track, and one clear CTA. Includes individual copy buttons and Markdown export (`[company-slug]-brief.md`).

### 5. Multi-Threading & 5-Step SDR Cadence Tracker
- **Multi-Threading Stakeholders**: Track multiple contacts per account with titles, Persona pills, Buying Role badges (`Champion`, `Economic Buyer`, `Legal / Technical Evaluator`), and outreach statuses. Selecting a contact dynamically updates the brief and talk track for that persona.
- **5-Step Cadence Bar**: `Step 1: Email + LI` -> `Step 2: Cold Call 1` -> `Step 3: Value Bump Email` -> `Step 4: Second Call + VM` -> `Step 5: Breakup Note` with interactive step tracking and date picker.

### 6. Cold Call Split-Screen Mode
- Zero-scroll, high-focus live dialing layout:
  - **Left Pane**: 30-Second Talk Track for active stakeholder + Top 3 Discovery Questions + Collapsible Objection Battlecards (Wise/PayPal, Rippling/Gusto, Foreign Entity).
  - **Right Pane**: Live Call Notes box + 1-Click Call Outcome logger (`No Answer`, `Gatekeeper`, `Pitched - Not Interested`, `Follow-Up Requested`, `Meeting Booked`) that saves to `call_logs` and auto-advances account status.

### 7. Qualification & AE Handoff Tab
- Structured qualification fields: Identified Pain, Current Vendor / Process, Target Timeline, Live Call Notes.
- One-click `"Copy AE Handoff Packet"` button copies a standardized CRM-ready briefing to clipboard.

### 8. Pre-Seeded Deel SAMPLE Account
- `Veloce Cloud Systems (SAMPLE)` pre-loaded with realistic research notes, 2 multi-threaded contacts (`Elena Rostova - VP of People` and `Marcus Vance - CFO`), active signals, and qualification notes.

---

## Tech Stack

- **Backend**: Python 3.11+, FastAPI, SQLite (`prospecting_engine.db`), Pydantic v2, Pytest, HTTPX.
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v3, Recharts, Lucide React.
- **Design Rules**: Fixed dark slate left sidebar (`#0F172A`), high-contrast light content area (`#F8FAFC`), crisp borders (`#E2E8F0`), strictly zero emojis, and strictly zero purple gradients.

---

## Quickstart: Running Locally on Windows

Open two Windows PowerShell terminals:

### Terminal 1: FastAPI Backend
```powershell
cd C:\Users\nicho\prospecting-engine\backend
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
> API runs at `http://127.0.0.1:8000` (Interactive Swagger docs at `http://127.0.0.1:8000/docs`).

### Terminal 2: React Frontend
```powershell
cd C:\Users\nicho\prospecting-engine\frontend
npm run dev
```
> Web UI opens at `http://localhost:5173`.

---

## Automated Verification

Run backend unit and integration test suite (9 tests covering full Deel lifecycle):
```powershell
cd C:\Users\nicho\prospecting-engine\backend
.\venv\Scripts\pytest.exe tests\test_api.py
```

Run frontend production build verification:
```powershell
cd C:\Users\nicho\prospecting-engine\frontend
npm run build
```
