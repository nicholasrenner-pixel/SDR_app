import pytest
from app.scoring import calculate_lead_score, SIGNALS_CONFIG


def test_empty_signals_and_no_size():
    res = calculate_lead_score({}, None)
    assert res["total_score"] == 0
    assert res["temperature"] == "COLD"
    assert len(res["items"]) == len(SIGNALS_CONFIG) + 1


def test_company_size_scoring():
    # 201-1000 size is worth 20 points
    res = calculate_lead_score({}, "201-1000")
    assert res["total_score"] == 20
    assert res["temperature"] == "COLD"

    # 51-200 size is worth 16 points
    res_mid = calculate_lead_score({}, "51-200")
    assert res_mid["total_score"] == 16


def test_warm_tier_threshold():
    # 45-74 is WARM
    # Size 201-1000 (20 pts) + hiring_sdrs_aes (12 pts) + new_funding (12 pts) + using_competitor (8 pts) = 52 pts
    signals = {
        "hiring_sdrs_aes": True,
        "new_funding": True,
        "using_competitor": True
    }
    res = calculate_lead_score(signals, "201-1000")
    assert res["total_score"] == 52
    assert res["temperature"] == "WARM"


def test_hot_tier_threshold():
    # >= 75 is HOT
    # All signals (80 pts) + Size (20 pts) = 100 pts
    all_signals = {k: True for k in SIGNALS_CONFIG.keys()}
    res = calculate_lead_score(all_signals, "201-1000")
    assert res["total_score"] == 100
    assert res["temperature"] == "HOT"


def test_point_by_point_breakdown_transparency():
    signals = {"new_funding": True}
    res = calculate_lead_score(signals, "11-50")
    # new_funding: 12, size 11-50: 8 -> total = 20
    assert res["total_score"] == 20
    funding_item = next(i for i in res["items"] if i["factor"] == "New funding")
    assert funding_item["earned"] is True
    assert funding_item["points_awarded"] == 12
    assert funding_item["max_points"] == 12

    size_item = next(i for i in res["items"] if "Company Size Fit" in i["factor"])
    assert size_item["earned"] is True
    assert size_item["points_awarded"] == 8
