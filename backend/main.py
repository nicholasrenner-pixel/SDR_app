import json
import re
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse

from database import get_connection, init_db, seed_sample_if_empty
from models import (
    AccountCreate, AccountUpdate, AccountResponse,
    ContactCreate, ContactResponse,
    CallLogCreate, CallLogResponse,
    SignalsUpdateRequest, ScoreResponse, BriefResponse,
    DashboardAnalytics
)
from scoring import calculate_deel_score, detect_keyword_signals
from brief_generator import generate_deel_brief, generate_ae_handoff_markdown


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    seed_sample_if_empty()
    yield


app = FastAPI(
    title="Deel Prospecting Engine API",
    description="Production-grade Outbound SDR Qualification Workstation for Deel",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def row_to_account_dict(row, contacts=None, call_logs=None) -> dict:
    d = dict(row)
    try:
        d["buying_signals"] = json.loads(d.get("buying_signals") or "[]")
    except Exception:
        d["buying_signals"] = []

    try:
        d["red_flags"] = json.loads(d.get("red_flags") or "[]")
    except Exception:
        d["red_flags"] = []

    # Score breakdown
    score_details = calculate_deel_score(
        company_size=d.get("company_size") or "201-1000",
        buying_signals=d["buying_signals"],
        red_flags=d["red_flags"]
    )
    d["score_details"] = score_details

    d["contacts"] = contacts or []
    d["call_logs"] = call_logs or []
    return d


# ---------------- API ROUTES ----------------

@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "Deel Prospecting Engine", "version": "2.0.0"}


@app.get("/api/analytics", response_model=DashboardAnalytics)
def get_analytics():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM accounts")
    rows = cursor.fetchall()
    total = len(rows)

    hot = sum(1 for r in rows if r["temperature"] == "HOT")
    warm = sum(1 for r in rows if r["temperature"] == "WARM")
    cold = sum(1 for r in rows if r["temperature"] == "COLD")
    disqualified = sum(1 for r in rows if r["temperature"] == "DISQUALIFIED")
    meetings = sum(1 for r in rows if r["status"] == "Meeting")

    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    due_today = sum(1 for r in rows if r["follow_up_due"] and r["follow_up_due"] <= today_str and r["status"] != "Meeting")

    status_counts = {"New": 0, "Ready": 0, "Contacted": 0, "Replied": 0, "Meeting": 0}
    for r in rows:
        st = r["status"]
        status_counts[st] = status_counts.get(st, 0) + 1

    temperature_counts = {
        "HOT": hot,
        "WARM": warm,
        "COLD": cold,
        "DISQUALIFIED": disqualified
    }

    # Pipeline Funnel Conversion:
    # 1. Accounts (Total)
    # 2. Ready for Outreach (Ready + Contacted + Replied + Meeting)
    # 3. Contacted (Contacted + Replied + Meeting)
    # 4. Replied (Replied + Meeting)
    # 5. Meeting
    ready_and_beyond = sum(1 for r in rows if r["status"] in ["Ready", "Contacted", "Replied", "Meeting"])
    contacted_and_beyond = sum(1 for r in rows if r["status"] in ["Contacted", "Replied", "Meeting"])
    replied_and_beyond = sum(1 for r in rows if r["status"] in ["Replied", "Meeting"])

    funnel_counts = {
        "Total Accounts": total,
        "Ready": ready_and_beyond,
        "Contacted": contacted_and_beyond,
        "Replied": replied_and_beyond,
        "Meeting": meetings
    }

    avg_score = round(sum(r["lead_score"] for r in rows) / total, 1) if total > 0 else 0.0

    conn.close()
    return {
        "total_accounts": total,
        "hot_count": hot,
        "warm_count": warm,
        "cold_count": cold,
        "disqualified_count": disqualified,
        "meetings_count": meetings,
        "due_today_count": due_today,
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
    due_today: Optional[bool] = Query(False)
):
    conn = get_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM accounts WHERE 1=1"
    params = []

    if status and status != "All":
        query += " AND status = ?"
        params.append(status)

    if temperature and temperature != "All":
        query += " AND temperature = ?"
        params.append(temperature)

    if due_today:
        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        query += " AND follow_up_due <= ? AND status != 'Meeting'"
        params.append(today_str)

    query += " ORDER BY lead_score DESC, id DESC"
    cursor.execute(query, params)
    account_rows = cursor.fetchall()

    results = []
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    for acc_row in account_rows:
        acc_id = acc_row["id"]
        # Fetch contacts
        cursor.execute("SELECT * FROM contacts WHERE account_id = ? ORDER BY id ASC", (acc_id,))
        contact_rows = [dict(c) for c in cursor.fetchall()]

        # Filter search in python if search param present (searches company, industry, contacts)
        if search:
            s_low = search.strip().lower()
            company_match = s_low in (acc_row["company_name"] or "").lower()
            industry_match = s_low in (acc_row["industry"] or "").lower()
            contact_match = any(
                s_low in c["full_name"].lower() or s_low in c["title"].lower()
                for c in contact_rows
            )
            if not (company_match or industry_match or contact_match):
                continue

        results.append(row_to_account_dict(acc_row, contacts=contact_rows))

    conn.close()
    return results


@app.post("/api/accounts", response_model=AccountResponse)
def create_account(payload: AccountCreate):
    conn = get_connection()
    cursor = conn.cursor()

    now = datetime.now(timezone.utc).isoformat()
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # Keyword auto-detection for positive signals & red flags
    detected_positives, detected_red_flags = detect_keyword_signals(payload.research_notes)

    # Calculate initial score
    score_data = calculate_deel_score(
        company_size=payload.company_size,
        buying_signals=detected_positives,
        red_flags=detected_red_flags
    )

    cursor.execute("""
    INSERT INTO accounts (
        company_name, website, industry, company_size, hq_location,
        research_notes, buying_signals, red_flags, lead_score, temperature,
        recommended_product, status, cadence_step, follow_up_due,
        qualification_pain, qualification_current_vendor, qualification_timeline,
        qualification_notes, is_sample, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        payload.company_name.strip(),
        payload.website,
        payload.industry,
        payload.company_size,
        payload.hq_location,
        payload.research_notes.strip(),
        json.dumps(detected_positives),
        json.dumps(detected_red_flags),
        score_data["lead_score"],
        score_data["temperature"],
        score_data["recommended_product"],
        "New",
        1,
        today_str,
        "",
        "",
        "",
        "",
        0,
        now
    ))
    account_id = cursor.lastrowid

    # Add primary contact if provided
    contacts = []
    if payload.primary_contact_name:
        cursor.execute("""
        INSERT INTO contacts (account_id, full_name, title, persona, buying_role, linkedin_url, outreach_status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            account_id,
            payload.primary_contact_name.strip(),
            payload.primary_contact_title or "Stakeholder",
            payload.primary_contact_persona or "VP of People / Talent",
            payload.primary_contact_role or "Champion",
            payload.primary_contact_linkedin,
            "Not Contacted"
        ))
        contact_id = cursor.lastrowid
        contacts.append({
            "id": contact_id,
            "account_id": account_id,
            "full_name": payload.primary_contact_name.strip(),
            "title": payload.primary_contact_title or "Stakeholder",
            "persona": payload.primary_contact_persona or "VP of People / Talent",
            "buying_role": payload.primary_contact_role or "Champion",
            "linkedin_url": payload.primary_contact_linkedin,
            "outreach_status": "Not Contacted"
        })

    conn.commit()

    cursor.execute("SELECT * FROM accounts WHERE id = ?", (account_id,))
    new_acc = cursor.fetchone()
    conn.close()

    return row_to_account_dict(new_acc, contacts=contacts)


@app.get("/api/accounts/{account_id}", response_model=AccountResponse)
def get_account(account_id: int):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM accounts WHERE id = ?", (account_id,))
    acc_row = cursor.fetchone()
    if not acc_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Account not found")

    cursor.execute("SELECT * FROM contacts WHERE account_id = ? ORDER BY id ASC", (account_id,))
    contact_rows = [dict(c) for c in cursor.fetchall()]

    cursor.execute("SELECT * FROM call_logs WHERE account_id = ? ORDER BY id DESC", (account_id,))
    call_log_rows = [dict(l) for l in cursor.fetchall()]

    conn.close()
    return row_to_account_dict(acc_row, contacts=contact_rows, call_logs=call_log_rows)


@app.put("/api/accounts/{account_id}", response_model=AccountResponse)
def update_account(account_id: int, payload: AccountUpdate):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM accounts WHERE id = ?", (account_id,))
    acc_row = cursor.fetchone()
    if not acc_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Account not found")

    update_dict = payload.model_dump(exclude_unset=True)

    fields = []
    values = []
    for k, v in update_dict.items():
        fields.append(f"{k} = ?")
        values.append(v)

    if fields:
        values.append(account_id)
        cursor.execute(f"UPDATE accounts SET {', '.join(fields)} WHERE id = ?", values)
        conn.commit()

    # Recalculate score if company_size changed
    if "company_size" in update_dict:
        cursor.execute("SELECT * FROM accounts WHERE id = ?", (account_id,))
        refreshed = cursor.fetchone()
        b_sigs = json.loads(refreshed["buying_signals"] or "[]")
        r_flags = json.loads(refreshed["red_flags"] or "[]")
        score_data = calculate_deel_score(refreshed["company_size"], b_sigs, r_flags)
        cursor.execute("""
        UPDATE accounts SET lead_score = ?, temperature = ?, recommended_product = ? WHERE id = ?
        """, (score_data["lead_score"], score_data["temperature"], score_data["recommended_product"], account_id))
        conn.commit()

    cursor.execute("SELECT * FROM accounts WHERE id = ?", (account_id,))
    final_acc = cursor.fetchone()

    cursor.execute("SELECT * FROM contacts WHERE account_id = ? ORDER BY id ASC", (account_id,))
    contacts = [dict(c) for c in cursor.fetchall()]

    cursor.execute("SELECT * FROM call_logs WHERE account_id = ? ORDER BY id DESC", (account_id,))
    call_logs = [dict(l) for l in cursor.fetchall()]

    conn.close()
    return row_to_account_dict(final_acc, contacts=contacts, call_logs=call_logs)


@app.patch("/api/accounts/{account_id}/status", response_model=AccountResponse)
def update_status(account_id: int, status: str = Query(...)):
    valid_statuses = ["New", "Ready", "Contacted", "Replied", "Meeting"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE accounts SET status = ? WHERE id = ?", (status, account_id))
    conn.commit()

    cursor.execute("SELECT * FROM accounts WHERE id = ?", (account_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Account not found")

    cursor.execute("SELECT * FROM contacts WHERE account_id = ?", (account_id,))
    contacts = [dict(c) for c in cursor.fetchall()]
    conn.close()
    return row_to_account_dict(row, contacts=contacts)


@app.put("/api/accounts/{account_id}/signals", response_model=AccountResponse)
def update_signals(account_id: int, payload: SignalsUpdateRequest):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM accounts WHERE id = ?", (account_id,))
    acc_row = cursor.fetchone()
    if not acc_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Account not found")

    score_data = calculate_deel_score(
        company_size=acc_row["company_size"],
        buying_signals=payload.buying_signals,
        red_flags=payload.red_flags
    )

    cursor.execute("""
    UPDATE accounts
    SET buying_signals = ?, red_flags = ?, lead_score = ?, temperature = ?, recommended_product = ?
    WHERE id = ?
    """, (
        json.dumps(payload.buying_signals),
        json.dumps(payload.red_flags),
        score_data["lead_score"],
        score_data["temperature"],
        score_data["recommended_product"],
        account_id
    ))
    conn.commit()

    cursor.execute("SELECT * FROM accounts WHERE id = ?", (account_id,))
    updated_acc = cursor.fetchone()

    cursor.execute("SELECT * FROM contacts WHERE account_id = ?", (account_id,))
    contacts = [dict(c) for c in cursor.fetchall()]

    cursor.execute("SELECT * FROM call_logs WHERE account_id = ?", (account_id,))
    call_logs = [dict(l) for l in cursor.fetchall()]

    conn.close()
    return row_to_account_dict(updated_acc, contacts=contacts, call_logs=call_logs)


# ---------------- MULTI-THREADING CONTACTS ----------------

@app.post("/api/accounts/{account_id}/contacts", response_model=ContactResponse)
def add_contact(account_id: int, payload: ContactCreate):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM accounts WHERE id = ?", (account_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Account not found")

    cursor.execute("""
    INSERT INTO contacts (account_id, full_name, title, persona, buying_role, linkedin_url, outreach_status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        account_id,
        payload.full_name.strip(),
        payload.title.strip(),
        payload.persona,
        payload.buying_role,
        payload.linkedin_url,
        payload.outreach_status or "Not Contacted"
    ))
    contact_id = cursor.lastrowid
    conn.commit()

    cursor.execute("SELECT * FROM contacts WHERE id = ?", (contact_id,))
    new_c = cursor.fetchone()
    conn.close()
    return dict(new_c)


@app.patch("/api/accounts/{account_id}/contacts/{contact_id}", response_model=ContactResponse)
def update_contact_status(account_id: int, contact_id: int, outreach_status: str = Query(...)):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("UPDATE contacts SET outreach_status = ? WHERE id = ? AND account_id = ?", (outreach_status, contact_id, account_id))
    conn.commit()

    cursor.execute("SELECT * FROM contacts WHERE id = ?", (contact_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Contact not found")
    return dict(row)


@app.delete("/api/accounts/{account_id}/contacts/{contact_id}")
def delete_contact(account_id: int, contact_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM contacts WHERE id = ? AND account_id = ?", (contact_id, account_id))
    conn.commit()
    conn.close()
    return {"message": "Contact deleted"}


# ---------------- COLD CALL LOGS ----------------

@app.post("/api/accounts/{account_id}/call-logs", response_model=CallLogResponse)
def log_call_outcome(account_id: int, payload: CallLogCreate):
    conn = get_connection()
    cursor = conn.cursor()

    now = datetime.now(timezone.utc).isoformat()
    cursor.execute("""
    INSERT INTO call_logs (account_id, contact_name, outcome, notes, logged_at)
    VALUES (?, ?, ?, ?, ?)
    """, (
        account_id,
        payload.contact_name,
        payload.outcome,
        payload.notes,
        now
    ))
    call_log_id = cursor.lastrowid

    # Auto-update status if outcome warrants it
    if payload.outcome == "Meeting Booked":
        cursor.execute("UPDATE accounts SET status = 'Meeting' WHERE id = ?", (account_id,))
    elif payload.outcome in ["Follow-Up Requested", "Pitched - Not Interested"] and payload.outcome != "No Answer":
        cursor.execute("UPDATE accounts SET status = 'Contacted' WHERE id = ? AND status = 'New'", (account_id,))

    conn.commit()
    cursor.execute("SELECT * FROM call_logs WHERE id = ?", (call_log_id,))
    log_row = cursor.fetchone()
    conn.close()
    return dict(log_row)


# ---------------- GROUNDED BRIEFS & EXPORTS ----------------

@app.get("/api/accounts/{account_id}/brief", response_model=BriefResponse)
def get_brief(account_id: int, contact_id: Optional[int] = Query(None)):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM accounts WHERE id = ?", (account_id,))
    acc = cursor.fetchone()
    if not acc:
        conn.close()
        raise HTTPException(status_code=404, detail="Account not found")

    # Fetch target contact if requested, else first contact
    contact = None
    if contact_id:
        cursor.execute("SELECT * FROM contacts WHERE id = ? AND account_id = ?", (contact_id, account_id))
        contact = cursor.fetchone()

    if not contact:
        cursor.execute("SELECT * FROM contacts WHERE account_id = ? ORDER BY id ASC LIMIT 1", (account_id,))
        contact = cursor.fetchone()

    conn.close()

    c_name = contact["full_name"] if contact else "Prospect"
    c_title = contact["title"] if contact else "Leadership"
    c_persona = contact["persona"] if contact else "VP of People / Talent"

    b_signals = json.loads(acc["buying_signals"] or "[]")
    r_flags = json.loads(acc["red_flags"] or "[]")

    brief_data = generate_deel_brief(
        company_name=acc["company_name"],
        contact_name=c_name,
        contact_title=c_title,
        persona=c_persona,
        recommended_product=acc["recommended_product"],
        research_notes=acc["research_notes"],
        buying_signals=b_signals,
        red_flags=r_flags
    )

    return {
        "account_id": acc["id"],
        "company_name": acc["company_name"],
        "contact_name": c_name,
        "contact_title": c_title,
        "persona": c_persona,
        "recommended_product": acc["recommended_product"],
        **brief_data
    }


@app.get("/api/accounts/{account_id}/export-brief")
def export_brief_markdown(account_id: int, contact_id: Optional[int] = Query(None)):
    brief_data = get_brief(account_id, contact_id)
    company_name = brief_data["company_name"]
    slug = re.sub(r'[^a-zA-Z0-9]+', '-', company_name.lower()).strip('-')

    first_lines_md = "\n".join([f"- **Line {idx+1}**: {l}" for idx, l in enumerate(brief_data["personalized_first_lines"])])
    questions_md = "\n".join([f"{idx+1}. {q}" for idx, q in enumerate(brief_data["discovery_questions"])])
    objections_md = "\n\n".join([
        f"**Objection**: {o.get('objection')}\n**Deel Rebuttal**: {o.get('response')}"
        for o in brief_data.get("objections", [])
    ])

    markdown_content = f"""# Deel Outreach Brief: {company_name}

**Target Contact**: {brief_data['contact_name']} ({brief_data['contact_title']})  
**Persona**: {brief_data['persona']}  
**Recommended Deel Product**: {brief_data['recommended_product']}  
**Generated At**: {brief_data['generated_at']}  

---

## 1. Company Summary (Notes Grounded)
{brief_data['company_summary']}

---

## 2. Best Outreach Angle
{brief_data['best_outreach_angle']}

---

## 3. Personalized First Lines (Strictly Grounded in Notes)
{first_lines_md}

---

## 4. Deel Discovery Questions
{questions_md}

---

## 5. Likely Objections & Battlecard Rebuttals
{objections_md}

---

## 6. 30-Second Cold Call Talk Track
{brief_data['talk_track']}

---

## 7. Recommended Next Step
{brief_data['next_step']}

---
*Generated by Prospecting Engine — Grounded Deel SDR Workstation*
"""
    filename = f"{slug}-brief.md"
    return Response(
        content=markdown_content,
        media_type="text/markdown",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


@app.get("/api/accounts/{account_id}/ae-handoff", response_class=PlainTextResponse)
def get_ae_handoff(account_id: int):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM accounts WHERE id = ?", (account_id,))
    acc_row = cursor.fetchone()
    if not acc_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Account not found")

    cursor.execute("SELECT * FROM contacts WHERE account_id = ?", (account_id,))
    contact_rows = [dict(c) for c in cursor.fetchall()]
    conn.close()

    acc_dict = dict(acc_row)
    acc_dict["buying_signals"] = json.loads(acc_dict.get("buying_signals") or "[]")
    acc_dict["red_flags"] = json.loads(acc_dict.get("red_flags") or "[]")

    return generate_ae_handoff_markdown(acc_dict, contact_rows)


@app.delete("/api/accounts/{account_id}")
def delete_account(account_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM accounts WHERE id = ?", (account_id,))
    conn.commit()
    conn.close()
    return {"message": "Account deleted successfully"}


@app.delete("/api/sample-data")
def delete_sample_data():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM accounts WHERE is_sample = 1")
    sample_ids = [r[0] for r in cursor.fetchall()]
    for s_id in sample_ids:
        cursor.execute("DELETE FROM accounts WHERE id = ?", (s_id,))
    conn.commit()
    conn.close()
    return {"message": f"Deleted {len(sample_ids)} sample account(s)", "deleted_count": len(sample_ids)}


@app.post("/api/sample-data/restore")
def restore_sample_data():
    seed_sample_if_empty()
    return {"message": "Sample data restored successfully"}
