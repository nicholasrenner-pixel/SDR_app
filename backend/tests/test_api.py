import pytest
from fastapi.testclient import TestClient
from main import app
from database import init_db, seed_sample_if_empty, get_connection

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_test_db():
    init_db()
    seed_sample_if_empty()


def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["version"] == "2.0.0"


def test_sample_seeding_and_analytics():
    analytics_res = client.get("/api/analytics")
    assert analytics_res.status_code == 200
    analytics = analytics_res.json()
    assert analytics["total_accounts"] >= 1
    assert analytics["hot_count"] >= 1

    accounts_res = client.get("/api/accounts")
    assert accounts_res.status_code == 200
    accounts = accounts_res.json()
    sample = next((a for a in accounts if a["is_sample"] == 1), None)
    assert sample is not None
    assert "Veloce Cloud Systems" in sample["company_name"]
    assert sample["lead_score"] == 100
    assert sample["temperature"] == "HOT"
    assert sample["recommended_product"] == "Deel EOR"
    assert len(sample["contacts"]) >= 2
    assert any(c["full_name"] == "Elena Rostova" for c in sample["contacts"])
    assert any(c["full_name"] == "Marcus Vance" for c in sample["contacts"])


def test_account_creation_with_keyword_detection():
    notes = (
        "OmniTech recently completed a $25M Series A funding round to expand its engineering footprint. "
        "They are actively recruiting remote engineers in Brazil and Poland to support their core cloud platform. "
        "The VP of People noted that onboarding contractors across those countries is creating severe administrative friction."
    )
    payload = {
        "company_name": "OmniTech Global",
        "website": "https://omnitech.example.com",
        "industry": "Enterprise SaaS",
        "company_size": "201-1000",
        "hq_location": "Denver, CO",
        "research_notes": notes,
        "primary_contact_name": "Sarah Jenkins",
        "primary_contact_title": "Head of People",
        "primary_contact_persona": "VP of People / Talent",
        "primary_contact_role": "Champion",
        "primary_contact_linkedin": "https://linkedin.com/in/sarah-jenkins"
    }

    create_res = client.post("/api/accounts", json=payload)
    assert create_res.status_code == 200
    acc = create_res.json()
    acc_id = acc["id"]
    assert acc["company_name"] == "OmniTech Global"
    # Auto-detected signals from keywords: remote_global_hiring, recent_funding
    assert "remote_global_hiring" in acc["buying_signals"]
    assert "recent_funding" in acc["buying_signals"]
    assert acc["lead_score"] >= 65
    assert acc["recommended_product"] == "Deel EOR"
    assert len(acc["contacts"]) == 1
    assert acc["contacts"][0]["full_name"] == "Sarah Jenkins"

    # Clean up
    client.delete(f"/api/accounts/{acc_id}")


def test_signals_toggling_scoring_and_disqualification():
    payload = {
        "company_name": "MetricScale Labs",
        "company_size": "51-200",  # Base 20 pts
        "research_notes": "Scaling data infrastructure team.",
        "primary_contact_name": "Dave Miller",
        "primary_contact_title": "CFO"
    }
    create_res = client.post("/api/accounts", json=payload)
    acc = create_res.json()
    acc_id = acc["id"]

    # 1. Initially base size points (20 pts) -> COLD
    assert acc["lead_score"] == 20
    assert acc["temperature"] == "COLD"

    # 2. Add contractor_misclassification (20 pts) + fragmented_payroll (20 pts) -> 60 pts (WARM)
    sig_update = {
        "buying_signals": ["contractor_misclassification", "fragmented_payroll"],
        "red_flags": []
    }
    update_res = client.put(f"/api/accounts/{acc_id}/signals", json=sig_update)
    assert update_res.status_code == 200
    upd = update_res.json()
    assert upd["lead_score"] == 60
    assert upd["temperature"] == "WARM"
    assert upd["recommended_product"] in ["Deel Contractor & Shield", "Deel Global Payroll"]

    # 3. Add remote_global_hiring (25 pts) -> 85 pts (HOT)
    hot_update = {
        "buying_signals": ["contractor_misclassification", "fragmented_payroll", "remote_global_hiring"],
        "red_flags": []
    }
    hot_res = client.put(f"/api/accounts/{acc_id}/signals", json=hot_update)
    assert hot_res.json()["lead_score"] == 85
    assert hot_res.json()["temperature"] == "HOT"
    assert hot_res.json()["recommended_product"] == "Deel EOR"

    # 4. Add domestic_only red flag (-30 pts) and remove positive signals -> DISQUALIFIED
    disqual_update = {
        "buying_signals": [],
        "red_flags": ["domestic_only"]
    }
    disqual_res = client.put(f"/api/accounts/{acc_id}/signals", json=disqual_update)
    assert disqual_res.json()["temperature"] == "DISQUALIFIED"
    assert disqual_res.json()["lead_score"] == 0

    # Clean up
    client.delete(f"/api/accounts/{acc_id}")


def test_strict_grounding_and_not_in_notes_fallback():
    # Account with empty / minimal notes
    payload = {
        "company_name": "Blank Slate Co",
        "company_size": "1-50",
        "research_notes": "",
        "primary_contact_name": "John Smith",
        "primary_contact_title": "Director"
    }
    create_res = client.post("/api/accounts", json=payload)
    acc_id = create_res.json()["id"]

    brief_res = client.get(f"/api/accounts/{acc_id}/brief")
    assert brief_res.status_code == 200
    brief = brief_res.json()

    # Strict grounding verification:
    assert brief["company_summary"] == "Not in notes"
    assert all(line == "Not in notes" for line in brief["personalized_first_lines"])
    assert all(q == "Not in notes" for q in brief["discovery_questions"])
    assert brief["talk_track"] == "Not in notes"
    assert brief["next_step"] == "Not in notes"

    # Clean up
    client.delete(f"/api/accounts/{acc_id}")


def test_multi_threading_and_persona_angles():
    # Use pre-seeded sample account
    accounts_res = client.get("/api/accounts")
    sample = next(a for a in accounts_res.json() if a["is_sample"] == 1)
    acc_id = sample["id"]

    elena = next(c for c in sample["contacts"] if "Elena" in c["full_name"])
    marcus = next(c for c in sample["contacts"] if "Marcus" in c["full_name"])

    # 1. Brief for Elena (VP of People)
    brief_elena = client.get(f"/api/accounts/{acc_id}/brief?contact_id={elena['id']}").json()
    assert "Elena Rostova" in brief_elena["contact_name"]
    assert "Rapid Global Hiring Velocity" in brief_elena["best_outreach_angle"]
    assert "Elena Rostova" in brief_elena["talk_track"]

    # 2. Brief for Marcus (CFO)
    brief_marcus = client.get(f"/api/accounts/{acc_id}/brief?contact_id={marcus['id']}").json()
    assert "Marcus Vance" in brief_marcus["contact_name"]
    assert "Foreign Overhead Elimination & Contractor Shield" in brief_marcus["best_outreach_angle"]
    assert "Marcus Vance" in brief_marcus["talk_track"]


def test_call_logging_and_meeting_status():
    accounts_res = client.get("/api/accounts")
    sample = next(a for a in accounts_res.json() if a["is_sample"] == 1)
    acc_id = sample["id"]

    # Log a call outcome
    call_payload = {
        "contact_name": "Elena Rostova",
        "outcome": "Meeting Booked",
        "notes": "Agreed to 15-minute global payroll demo next Thursday at 2pm."
    }
    call_res = client.post(f"/api/accounts/{acc_id}/call-logs", json=call_payload)
    assert call_res.status_code == 200
    log = call_res.json()
    assert log["outcome"] == "Meeting Booked"

    # Account status should auto-update to 'Meeting'
    acc_res = client.get(f"/api/accounts/{acc_id}")
    assert acc_res.json()["status"] == "Meeting"


def test_ae_handoff_and_markdown_export():
    accounts_res = client.get("/api/accounts")
    sample = next(a for a in accounts_res.json() if a["is_sample"] == 1)
    acc_id = sample["id"]

    # 1. AE Handoff endpoint
    handoff_res = client.get(f"/api/accounts/{acc_id}/ae-handoff")
    assert handoff_res.status_code == 200
    assert "AE Handoff Packet: Veloce Cloud Systems" in handoff_res.text
    assert "Elena Rostova" in handoff_res.text
    assert "Marcus Vance" in handoff_res.text

    # 2. Brief Markdown Export endpoint
    export_res = client.get(f"/api/accounts/{acc_id}/export-brief")
    assert export_res.status_code == 200
    assert "text/markdown" in export_res.headers.get("content-type", "")
    assert "Deel Outreach Brief: Veloce Cloud Systems" in export_res.text


def test_delete_and_restore_sample_data():
    del_res = client.delete("/api/sample-data")
    assert del_res.status_code == 200
    assert del_res.json()["deleted_count"] >= 1

    # Verify no sample accounts remain
    acc_res = client.get("/api/accounts")
    assert not any(a["is_sample"] == 1 for a in acc_res.json())

    # Restore sample data
    restore_res = client.post("/api/sample-data/restore")
    assert restore_res.status_code == 200

    # Verify sample is back
    acc_res_2 = client.get("/api/accounts")
    assert any(a["is_sample"] == 1 for a in acc_res_2.json())
