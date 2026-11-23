# Prospecting Engine

> **Executive-Grade SDR Workstation & Grounded Outreach Intelligence Platform**  
> *Proof of work for B2B Sales Development Representatives (SDRs)*

Prospecting Engine turns unstructured company and prospect research notes into an objectively scored account, visual pipeline analytics, and an exportable, strictly grounded outreach brief. It is designed to run 100% locally on Windows with zero external API dependencies, zero hallucinated data, zero emojis, and a high-contrast executive design.

---

## Key Features

1. **Executive Dashboard & Real-Time Pipeline Analytics**:
   - **Accounts by Status**: Bar chart tracking accounts through the SDR lifecycle (`New`, `Ready`, `Contacted`, `Replied`, `Meeting`).
   - **Accounts by Temperature**: Categorical distribution of `HOT (75+)`, `WARM (45–74)`, and `COLD (<45)` accounts.
   - **Pipeline Funnel Conversion**: Step-down stage analysis measuring conversion rates from total accounts to booked meetings.
   - **Searchable & Filterable Table**: Real-time filtering by status and temperature tier with instant inline status updates.

2. **Transparent Lead Scoring Engine (100 Points Max)**:
   - **8 Buying Signals (Up to 80 pts)**:
     - *Hiring SDRs / AEs* (+12 pts)
     - *Hiring internationally* (+10 pts)
     - *New funding announced* (+12 pts)
     - *New leadership hired* (+10 pts)
     - *Using a competitor* (+8 pts)
     - *Expanding to new countries* (+10 pts)
     - *Payroll / compliance pain mentioned* (+10 pts)
     - *Headcount growing fast (>20%)* (+8 pts)
   - **ICP Company Size Fit (Up to 20 pts)**:
     - 201–1,000 employees: 20 pts (Sweet Spot)
     - 51–200 employees: 16 pts (Mid-Market)
     - 1,001+ employees: 14 pts (Enterprise)
     - 11–50 employees: 8 pts (Early Stage)
     - 1–10 employees: 4 pts (Micro)
   - **Point-by-Point Transparency**: An itemized modal explains the exact rationale for every earned and missed point.

3. **Strictly Grounded Brief Generation Engine (Zero Hallucination)**:
   - Analyzes **only** the pasted research notes—guaranteeing that every output is verifiable.
   - **Strict Grounding Rule**: If research notes do not contain sufficient evidence for a section or hook, it explicitly outputs `"Not in notes"` rather than inventing numbers or facts.
   - Structured 1-page outreach brief includes:
     - 3-Sentence Company Summary
     - Best Outreach Angle
     - 3 Personalized First Lines (verbatim quotes & references from notes)
     - 5 Tailored Discovery Questions
     - 3 Likely Objections with Custom SDR Responses
     - 30-Second Talk Track
     - One Clear Next Step
   - **One-Click Copy** buttons next to every line and section.
   - **Export Brief (.md)** button generating a downloadable `[company-slug]-brief.md` file.

4. **Sample Data Management**:
   - Pre-seeds a realistic `"Acme Freight Technologies [SAMPLE]"` account on first boot so charts render immediately.
   - Single-click **"Delete Sample Data"** button wipes demo data to start completely fresh, with a reload button available anytime.

---

## Tech Stack

- **Backend**: Python 3.13+, FastAPI, SQLAlchemy, SQLite, Pydantic v2, Pytest, HTTPX.
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v3, Recharts, Lucide-React.
- **Design System**: Deep slate navy sidebar (`#0f172a`), crisp white content canvas (`#f8fafc`), zero emojis, zero purple gradients.

---

## Quickstart: Running Locally on Windows

Open two separate Windows PowerShell terminals:

### Terminal 1: Launch Backend (FastAPI)
```powershell
cd C:\Users\nicho\prospecting-engine\backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
> API will run at: `http://127.0.0.1:8000` (Interactive docs at `http://127.0.0.1:8000/docs`)

### Terminal 2: Launch Frontend (React + Vite)
```powershell
cd C:\Users\nicho\prospecting-engine\frontend
npm run dev
```
> Web application will open at: `http://localhost:5173`

---

## Running Automated Tests

To execute the backend unit and integration test suite:
```powershell
cd C:\Users\nicho\prospecting-engine\backend
.\venv\Scripts\pytest.exe
```

To verify the frontend TypeScript and production build:
```powershell
cd C:\Users\nicho\prospecting-engine\frontend
npm run build
```
