import re
import json
from contextlib import asynccontextmanager
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func

from .database import engine, Base, get_db
from .models import Account, BuyingSignal, Brief
from .schemas import (
    AccountCreate, AccountUpdate, AccountResponse,
    SignalsUpdateRequest, ScoreResponse, DashboardAnalytics, BriefSection
)
from .scoring import calculate_lead_score, SIGNALS_CONFIG
from .brief_generator import generate_grounded_brief
from .seed import seed_sample_data_if_empty, delete_all_sample_data

# Create DB tables
Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: seed sample account if empty
    db = next(get_db())
    try:
        account_count = db.query(Account).count()
        if account_count == 0:
            seed_sample_data_if_empty(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="Prospecting Engine API",
    description="Locally hosted SDR Prospecting & Outreach Intelligence Engine",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def make_slug(name: str, db: Session, existing_id: Optional[int] = None) -> str:
    base = re.sub(r'[^a-zA-Z0-9]+', '-', name.lower()).strip('-')
    if not base:
        base = "account"
    slug = base
    counter = 1
    while True:
        query = db.query(Account).filter(Account.company_slug == slug)
        if existing_id:
            query = query.filter(Account.id != existing_id)
        if not query.first():
            return slug
        slug = f"{base}-{counter}"
        counter += 1


def build_account_response(acc: Account) -> dict:
    signals_dict = {k: False for k in SIGNALS_CONFIG.keys()}
    for s in acc.signals:
        signals_dict[s.signal_key] = s.is_active

    score_info = calculate_lead_score(signals_dict, acc.company_size)
    
    brief_data = None
    if acc.brief and acc.brief.content_json:
        try:
            brief_data = json.loads(acc.brief.content_json)
        except Exception:
            brief_data = None

    return {
        "id": acc.id,
        "company_name": acc.company_name,
        "company_slug": acc.company_slug,
        "website": acc.website,
        "industry": acc.industry,
        "company_size": acc.company_size,
        "location": acc.location,
        "prospect_name": acc.prospect_name,
        "prospect_title": acc.prospect_title,
        "linkedin_url": acc.linkedin_url,
        "research_notes": acc.research_notes,
        "lead_score": acc.lead_score,
        "temperature": acc.temperature,
        "status": acc.status,
        "is_sample": acc.is_sample,
        "created_at": acc.created_at,
        "updated_at": acc.updated_at,
        "signals": signals_dict,
        "brief": brief_data,
        "score_breakdown": score_info
    }


# ---------------- API ENDPOINTS ----------------

@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "Prospecting Engine"}


@app.get("/api/analytics", response_model=DashboardAnalytics)
def get_analytics(db: Session = Depends(get_db)):
    accounts = db.query(Account).all()
    total = len(accounts)

    hot = sum(1 for a in accounts if a.temperature == "HOT")
    warm = sum(1 for a in accounts if a.temperature == "WARM")
    cold = sum(1 for a in accounts if a.temperature == "COLD")

    status_counts = {
        "New": 0,
        "Ready": 0,
        "Contacted": 0,
        "Replied": 0,
        "Meeting": 0
    }
    for a in accounts:
        if a.status in status_counts:
            status_counts[a.status] += 1
        else:
            status_counts[a.status] = 1

    temperature_counts = {
        "HOT": hot,
        "WARM": warm,
        "COLD": cold
    }

    ready_and_beyond = sum(1 for a in accounts if a.status in ["Ready", "Contacted", "Replied", "Meeting"])
    contacted_and_beyond = sum(1 for a in accounts if a.status in ["Contacted", "Replied", "Meeting"])
    replied_and_beyond = sum(1 for a in accounts if a.status in ["Replied", "Meeting"])
    meeting_count = sum(1 for a in accounts if a.status == "Meeting")

    funnel_counts = {
        "Total Accounts": total,
        "Ready": ready_and_beyond,
        "Contacted": contacted_and_beyond,
        "Replied": replied_and_beyond,
        "Meeting": meeting_count
    }

    avg_score = round(sum(a.lead_score for a in accounts) / total, 1) if total > 0 else 0.0

    return {
        "total_accounts": total,
        "hot_count": hot,
        "warm_count": warm,
        "cold_count": cold,
        "status_counts": status_counts,
        "temperature_counts": temperature_counts,
        "funnel_counts": funnel_counts,
        "average_score": avg_score
    }


@app.get("/api/accounts", response_model=List[AccountResponse])
def list_accounts(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    temperature: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Account)
    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            (Account.company_name.ilike(search_filter)) |
            (Account.prospect_name.ilike(search_filter)) |
            (Account.industry.ilike(search_filter)) |
            (Account.prospect_title.ilike(search_filter))
        )
    if status and status != "All":
        query = query.filter(Account.status == status)
    if temperature and temperature != "All":
        query = query.filter(Account.temperature == temperature)

    accounts = query.order_by(Account.lead_score.desc(), Account.created_at.desc()).all()
    return [build_account_response(a) for a in accounts]


@app.post("/api/accounts", response_model=AccountResponse)
def create_account(payload: AccountCreate, db: Session = Depends(get_db)):
    slug = make_slug(payload.company_name, db)
    
    empty_signals = {k: False for k in SIGNALS_CONFIG.keys()}
    score_info = calculate_lead_score(empty_signals, payload.company_size)

    account = Account(
        company_name=payload.company_name.strip(),
        company_slug=slug,
        website=payload.website,
        industry=payload.industry,
        company_size=payload.company_size,
        location=payload.location,
        prospect_name=payload.prospect_name,
        prospect_title=payload.prospect_title,
        linkedin_url=payload.linkedin_url,
        research_notes=payload.research_notes or "",
        lead_score=score_info["total_score"],
        temperature=score_info["temperature"],
        status=payload.status or "New",
        is_sample=False
    )
    db.add(account)
    db.flush()

    for key in SIGNALS_CONFIG.keys():
        sig = BuyingSignal(account_id=account.id, signal_key=key, is_active=False)
        db.add(sig)

    db.commit()
    db.refresh(account)
    return build_account_response(account)


@app.get("/api/accounts/{account_id}", response_model=AccountResponse)
def get_account(account_id: int, db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return build_account_response(account)


@app.put("/api/accounts/{account_id}", response_model=AccountResponse)
def update_account(account_id: int, payload: AccountUpdate, db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(account, field, val)

    if "company_size" in update_data:
        signals_dict = {s.signal_key: s.is_active for s in account.signals}
        score_info = calculate_lead_score(signals_dict, account.company_size)
        account.lead_score = score_info["total_score"]
        account.temperature = score_info["temperature"]

    db.commit()
    db.refresh(account)
    return build_account_response(account)


@app.patch("/api/accounts/{account_id}/status", response_model=AccountResponse)
def update_account_status(account_id: int, status: str = Query(...), db: Session = Depends(get_db)):
    valid_statuses = ["New", "Ready", "Contacted", "Replied", "Meeting"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")

    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    account.status = status
    db.commit()
    db.refresh(account)
    return build_account_response(account)


@app.put("/api/accounts/{account_id}/signals", response_model=AccountResponse)
def update_signals(account_id: int, payload: SignalsUpdateRequest, db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    existing_signals = {s.signal_key: s for s in account.signals}
    for key, is_active in payload.signals.items():
        if key in existing_signals:
            existing_signals[key].is_active = is_active
        else:
            new_sig = BuyingSignal(account_id=account.id, signal_key=key, is_active=is_active)
            db.add(new_sig)

    db.flush()

    signals_dict = {key: bool(payload.signals.get(key, False)) for key in SIGNALS_CONFIG.keys()}
    score_info = calculate_lead_score(signals_dict, account.company_size)

    account.lead_score = score_info["total_score"]
    account.temperature = score_info["temperature"]

    db.commit()
    db.refresh(account)
    return build_account_response(account)


@app.post("/api/accounts/{account_id}/generate-brief", response_model=AccountResponse)
def generate_brief_endpoint(account_id: int, db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    signals_dict = {s.signal_key: s.is_active for s in account.signals}
    brief_data = generate_grounded_brief(
        company_name=account.company_name,
        prospect_name=account.prospect_name,
        prospect_title=account.prospect_title,
        research_notes=account.research_notes,
        active_signals=signals_dict
    )

    if account.brief:
        account.brief.content_json = json.dumps(brief_data)
        account.brief.generated_at = func.now()
    else:
        new_brief = Brief(
            account_id=account.id,
            content_json=json.dumps(brief_data)
        )
        db.add(new_brief)

    db.commit()
    db.refresh(account)
    return build_account_response(account)


@app.get("/api/accounts/{account_id}/export-brief")
def export_brief_markdown(account_id: int, db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    brief_data = None
    if account.brief and account.brief.content_json:
        try:
            brief_data = json.loads(account.brief.content_json)
        except Exception:
            pass

    if not brief_data:
        signals_dict = {s.signal_key: s.is_active for s in account.signals}
        brief_data = generate_grounded_brief(
            company_name=account.company_name,
            prospect_name=account.prospect_name,
            prospect_title=account.prospect_title,
            research_notes=account.research_notes,
            active_signals=signals_dict
        )

    p_name = account.prospect_name or "Prospect"
    p_title = account.prospect_title or "Role Unspecified"
    
    first_lines_md = "\n".join([f"- **Line {idx+1}**: {line}" for idx, line in enumerate(brief_data.get("personalized_first_lines", []))])
    discovery_md = "\n".join([f"{idx+1}. {q}" for idx, q in enumerate(brief_data.get("discovery_questions", []))])
    objections_md = "\n\n".join([
        f"**Objection**: {o.get('objection')}\n**Tailored Response**: {o.get('response')}"
        for o in brief_data.get("objections", [])
    ])

    markdown_content = f"""# Outreach Brief: {account.company_name}

**Target Prospect**: {p_name} ({p_title})  
**Company Website**: {account.website or 'Not specified'}  
**Industry & Size**: {account.industry or 'Not specified'} | {account.company_size or 'Not specified'}  
**Lead Score**: {account.lead_score}/100 ({account.temperature})  
**Generated At**: {brief_data.get('generated_at', 'N/A')}  

---

## 1. Company Summary
{brief_data.get('company_summary', 'Not in notes')}

---

## 2. Best Outreach Angle
{brief_data.get('best_outreach_angle', 'Not in notes')}

---

## 3. Personalized First Lines (Strictly Grounded in Notes)
{first_lines_md}

---

## 4. Discovery Questions
{discovery_md}

---

## 5. Likely Objections & Tailored Responses
{objections_md}

---

## 6. 30-Second Talk Track
{brief_data.get('talk_track', 'Not in notes')}

---

## 7. Recommended Next Step
{brief_data.get('next_step', 'Not in notes')}

---
*Generated by Prospecting Engine — Grounded B2B Sales Workstation*
"""

    filename = f"{account.company_slug}-brief.md"
    return Response(
        content=markdown_content,
        media_type="text/markdown",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


@app.delete("/api/accounts/{account_id}")
def delete_account(account_id: int, db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    db.delete(account)
    db.commit()
    return {"message": f"Account '{account.company_name}' deleted successfully"}


@app.delete("/api/sample-data")
def delete_sample_data_endpoint(db: Session = Depends(get_db)):
    count = delete_all_sample_data(db)
    return {"message": f"Deleted {count} sample account(s)", "deleted_count": count}


@app.post("/api/sample-data/restore")
def restore_sample_data_endpoint(db: Session = Depends(get_db)):
    sample = seed_sample_data_if_empty(db)
    return {"message": "Sample data seeded", "account_id": sample.id}
