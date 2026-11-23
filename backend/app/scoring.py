from typing import Dict, List, Any, Optional

SIGNALS_CONFIG = {
    "hiring_sdrs_aes": {
        "name": "Hiring SDRs / AEs",
        "category": "Sales Growth & Capacity",
        "points": 12,
        "description": "Active recruitment for outbound pipeline builders and quota carriers."
    },
    "hiring_internationally": {
        "name": "Hiring internationally",
        "category": "Global Expansion",
        "points": 10,
        "description": "Scaling distributed remote teams outside domestic headquarters."
    },
    "new_funding": {
        "name": "New funding",
        "category": "Budget Availability",
        "points": 12,
        "description": "Fresh venture or debt capital infusion earmarked for strategic growth."
    },
    "new_leadership": {
        "name": "New leadership",
        "category": "Strategic Inflection",
        "points": 10,
        "description": "New C-level or VP hire reviewing legacy vendors and establishing new tooling."
    },
    "using_competitor": {
        "name": "Using a competitor",
        "category": "Validated Category Need",
        "points": 8,
        "description": "Already allocating budget to solve this problem; ripe for competitive displacement."
    },
    "expanding_countries": {
        "name": "Expanding to new countries",
        "category": "Complexity / Market Expansion",
        "points": 10,
        "description": "Entering foreign jurisdictions with increased operational and regulatory friction."
    },
    "payroll_compliance_pain": {
        "name": "Payroll / compliance pain mentioned",
        "category": "High-Priority Pain Point",
        "points": 10,
        "description": "Explicit evidence of administrative bottleneck or regulatory drag in notes."
    },
    "headcount_growing_fast": {
        "name": "Headcount growing fast",
        "category": "Scale Velocity",
        "points": 8,
        "description": "Company personnel headcount growing by >20% YoY, straining existing workflows."
    }
}

COMPANY_SIZE_POINTS = {
    "201-1000": (20, "Sweet Spot: 201–1,000 employees represents ideal sales velocity and budget authority."),
    "51-200": (16, "High Growth: 51–200 employees has acute scaling pains and fast procurement cycles."),
    "1001-5000": (14, "Enterprise: 1,001–5,000 employees has massive contract potential with standard review cycles."),
    "5000+": (14, "Large Enterprise: 5,000+ employees offers huge scale but longer enterprise procurement."),
    "11-50": (8, "Early Stage: 11–50 employees moving past founder-led sales into structured processes."),
    "1-10": (4, "Micro/Seed: 1–10 employees with agile setup but limited dedicated budget authority.")
}


def calculate_lead_score(active_signals: Dict[str, bool], company_size: Optional[str]) -> Dict[str, Any]:
    """
    Computes an exact, transparent lead score out of 100 with itemized factor breakdown
    and temperature tiering:
    - HOT: 75+
    - WARM: 45–74
    - COLD: < 45
    """
    total_score = 0
    items: List[Dict[str, Any]] = []

    # 1. Evaluate Buying Signals (Up to 80 points)
    for key, cfg in SIGNALS_CONFIG.items():
        is_active = bool(active_signals.get(key, False))
        points_awarded = cfg["points"] if is_active else 0
        total_score += points_awarded
        items.append({
            "factor": cfg["name"],
            "category": cfg["category"],
            "points_awarded": points_awarded,
            "max_points": cfg["points"],
            "earned": is_active,
            "explanation": f"{cfg['description']} ({cfg['points']} pts)" if is_active else f"Not detected / inactive (0/{cfg['points']} pts)"
        })

    # 2. Evaluate Company Size ICP Fit (Up to 20 points)
    size_norm = (company_size or "").strip()
    size_points, size_desc = COMPANY_SIZE_POINTS.get(size_norm, (0, "Company size unspecified or unranked (0/20 pts)."))
    total_score += size_points
    items.append({
        "factor": f"Company Size Fit ({size_norm or 'Unspecified'})",
        "category": "Ideal Customer Profile (ICP)",
        "points_awarded": size_points,
        "max_points": 20,
        "earned": size_points > 0,
        "explanation": size_desc
    })

    # Cap score at 100
    total_score = min(total_score, 100)

    # Determine Temperature
    if total_score >= 75:
        temperature = "HOT"
    elif total_score >= 45:
        temperature = "WARM"
    else:
        temperature = "COLD"

    return {
        "total_score": total_score,
        "temperature": temperature,
        "items": items
    }
