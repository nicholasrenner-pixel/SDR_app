import pytest
from fastapi.testclient import TestClient
from app.main import app, get_db
from app.database import Base, engine
from sqlalchemy.orm import sessionmaker

TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
client = TestClient(app)


def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_crud_and_full_workflow():
    # 1. Create Account
    payload = {
        "company_name": "Testflow Systems",
        "website": "https://testflow.example.com",
        "industry": "Enterprise Software",
        "company_size": "201-1000",
        "location": "Austin, TX",
        "prospect_name": "Sarah Connor",
        "prospect_title": "Director of Sales Development",
        "research_notes": "Testflow posted on LinkedIn that they are hiring 10 SDRs to scale their Austin office. The team uses Outreach and Salesforce today.",
        "status": "New"
    }
    create_res = client.post("/api/accounts", json=payload)
    assert create_res.status_code == 200
    acc = create_res.json()
    acc_id = acc["id"]
    assert acc["company_name"] == "Testflow Systems"
    assert acc["lead_score"] == 20  # from 201-1000 size
    assert acc["temperature"] == "COLD"

    # 2. Toggle Buying Signals
    signals_update = {
        "signals": {
            "hiring_sdrs_aes": True,   # 12
            "using_competitor": True,  # 8
            "new_funding": True,       # 12
            "headcount_growing_fast": True # 8
        }
    }
    # Total: 20 (size) + 12 + 8 + 12 + 8 = 60 (WARM)
    sig_res = client.put(f"/api/accounts/{acc_id}/signals", json=signals_update)
    assert sig_res.status_code == 200
    updated_acc = sig_res.json()
    assert updated_acc["lead_score"] == 60
    assert updated_acc["temperature"] == "WARM"

    # Add more signals to make it HOT
    more_signals = {
        "signals": {
            **signals_update["signals"],
            "new_leadership": True,     # 10 -> 70
            "expanding_countries": True # 10 -> 80 (HOT)
        }
    }
    hot_res = client.put(f"/api/accounts/{acc_id}/signals", json=more_signals)
    assert hot_res.json()["lead_score"] == 80
    assert hot_res.json()["temperature"] == "HOT"

    # 3. Update Status
    status_res = client.patch(f"/api/accounts/{acc_id}/status?status=Ready")
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "Ready"

    # 4. Generate Brief
    brief_res = client.post(f"/api/accounts/{acc_id}/generate-brief")
    assert brief_res.status_code == 200
    brief = brief_res.json()["brief"]
    assert brief is not None
    assert "hiring 10 SDRs" in brief["company_summary"]
    assert any("Sarah Connor" in q or "hiring 10 SDRs" in q for q in brief["discovery_questions"])

    # 5. Export Brief (.md)
    export_res = client.get(f"/api/accounts/{acc_id}/export-brief")
    assert export_res.status_code == 200
    assert "text/markdown" in export_res.headers.get("content-type", "")
    assert "Outreach Brief: Testflow Systems" in export_res.text

    # 6. Analytics Verification
    analytics_res = client.get("/api/analytics")
    assert analytics_res.status_code == 200
    data = analytics_res.json()
    assert data["total_accounts"] >= 1
    assert data["hot_count"] >= 1
    assert "Ready" in data["funnel_counts"]

    # 7. Clean up
    del_res = client.delete(f"/api/accounts/{acc_id}")
    assert del_res.status_code == 200
