from typing import List, Dict, Any, Tuple

DEEL_POSITIVE_SIGNALS = {
    "remote_global_hiring": {
        "name": "Hiring remote / 'anywhere' roles outside HQ country",
        "points": 25,
        "product_wedge": "Deel EOR",
        "description": "Recruiting talent across foreign borders without established local entities.",
        "keywords": ["remote", "anywhere", "latam", "emea", "brazil", "poland", "germany", "international", "global hire", "cross-border"]
    },
    "recent_funding": {
        "name": "Recent funding round / rapid international GTM expansion",
        "points": 20,
        "product_wedge": "Deel EOR & Contractor",
        "description": "Fresh venture or private capital earmarked to accelerate international headcount.",
        "keywords": ["series a", "series b", "series c", "funding", "raised", "capital", "seed", "expansion", "growth"]
    },
    "contractor_misclassification": {
        "name": "Heavy international contractor headcount / misclassification risk",
        "points": 20,
        "product_wedge": "Deel Contractor & Shield",
        "description": "Dozens of foreign contractors acting as full-time staff, exposing firm to statutory fines.",
        "keywords": ["contractor", "freelance", "1099", "misclassification", "contractors", "independent", "compliance risk", "shield"]
    },
    "fragmented_payroll": {
        "name": "Operating 3+ fragmented local payroll providers across entities",
        "points": 20,
        "product_wedge": "Deel Global Payroll",
        "description": "Disjointed multi-country payroll operations causing reporting delays and reconciliation friction.",
        "keywords": ["payroll", "fragmented", "entities", "multi-currency", "reconciliation", "local payroll", "multi-country"]
    },
    "first_global_hr_hire": {
        "name": "Hiring first People Ops / Global Mobility / International Payroll role",
        "points": 15,
        "product_wedge": "Deel HR & Immigration",
        "description": "First strategic HR/People hire tasked with designing a compliant distributed workforce strategy.",
        "keywords": ["people ops", "global mobility", "head of people", "vp of people", "people operations", "talent operations", "international hr"]
    },
    "cross_border_ma_visa": {
        "name": "Cross-border M&A or employee visa relocation needs",
        "points": 15,
        "product_wedge": "Deel Immigration & EOR",
        "description": "Acquisition integration or talent transfers requiring work visas and rapid legal employer sponsor.",
        "keywords": ["visa", "immigration", "relocation", "sponsor", "m&a", "acquisition", "transfer"]
    }
}

DEEL_RED_FLAGS = {
    "domestic_only": {
        "name": "Strict domestic / on-site-only hiring policy",
        "points": -30,
        "description": "Executive policy mandate forbidding international or remote hiring.",
        "keywords": ["domestic only", "on-site only", "in-office only", "no remote", "us only", "us-only"]
    },
    "hiring_freeze": {
        "name": "Active company-wide hiring freeze or layoffs",
        "points": -25,
        "description": "Recruitment paused; expansion budgets frozen across all departments.",
        "keywords": ["hiring freeze", "layoffs", "downsizing", "restructuring", "cost cutting"]
    },
    "legacy_lock_in": {
        "name": "Legacy 5,000+ enterprise locked into multi-year Workday/ADP contracts",
        "points": -20,
        "description": "High procurement friction and multi-year vendor commitments preventing category switch.",
        "keywords": ["workday enterprise", "adp globalview", "multi-year contract", "legacy sap"]
    }
}

COMPANY_SIZE_SCORES = {
    "51-200": (20, "Sweet Spot: 51–200 employees has acute international hiring pains and high agility (+20 pts)."),
    "201-1000": (20, "Sweet Spot: 201–1,000 employees represents ideal sales velocity and multi-country EOR need (+20 pts)."),
    "1-50": (15, "Early Stage: 1–50 employees moving to foreign contractors or initial global hiring (+15 pts)."),
    "1001-5000": (10, "Enterprise: 1,001–5,000 employees target for Global Payroll & Contractor consolidation (+10 pts)."),
    "5000+": (5, "Large Enterprise: 5,000+ employees with legacy procurement and longer sales cycles (+5 pts).")
}


def detect_keyword_signals(notes: str) -> Tuple[List[str], List[str]]:
    """Scans raw research notes for keyword matches to auto-suggest signals."""
    notes_lower = (notes or "").lower()
    suggested_positives = []
    suggested_red_flags = []

    for key, cfg in DEEL_POSITIVE_SIGNALS.items():
        if any(kw in notes_lower for kw in cfg["keywords"]):
            suggested_positives.append(key)

    for key, cfg in DEEL_RED_FLAGS.items():
        if any(kw in notes_lower for kw in cfg["keywords"]):
            suggested_red_flags.append(key)

    return suggested_positives, suggested_red_flags


def calculate_deel_score(
    company_size: str,
    buying_signals: List[str],
    red_flags: List[str]
) -> Dict[str, Any]:
    """
    Computes deterministic Deel ICP score, factor breakdown, temperature, and product routing.
    """
    raw_score = 0
    breakdown = []

    # 1. Company Size Base Points
    size_norm = (company_size or "201-1000").strip()
    size_pts, size_desc = COMPANY_SIZE_SCORES.get(size_norm, (15, "Standard organization base score."))
    raw_score += size_pts
    breakdown.append({
        "factor": f"Company Size Base ({size_norm})",
        "category": "ICP Tier",
        "points": size_pts,
        "max_points": 20,
        "earned": True,
        "description": size_desc
    })

    # 2. Positive Buying Signals
    active_positive_configs = []
    for key, cfg in DEEL_POSITIVE_SIGNALS.items():
        is_active = key in buying_signals
        awarded = cfg["points"] if is_active else 0
        raw_score += awarded
        if is_active:
            active_positive_configs.append(cfg)
        breakdown.append({
            "factor": cfg["name"],
            "category": "Positive Buying Signal",
            "points": awarded,
            "max_points": cfg["points"],
            "earned": is_active,
            "description": f"{cfg['description']} [Recommended Wedge: {cfg['product_wedge']}]" if is_active else f"Not detected / inactive (0/{cfg['points']} pts)"
        })

    # 3. Red Flags Deductions
    has_red_flag = False
    for key, cfg in DEEL_RED_FLAGS.items():
        is_active = key in red_flags
        deduction = cfg["points"] if is_active else 0
        raw_score += deduction
        if is_active:
            has_red_flag = True
        breakdown.append({
            "factor": cfg["name"],
            "category": "Disqualification Red Flag",
            "points": deduction,
            "max_points": cfg["points"],
            "earned": is_active,
            "description": cfg["description"] if is_active else "Clear / No red flag detected."
        })

    # 4. Temperature Determination
    # Rule: If any red flag drops raw score below 25 or domestic_only is checked with 0 positive signals -> DISQUALIFIED
    is_disqualified = (
        raw_score < 25 and has_red_flag
    ) or (
        "domestic_only" in red_flags and len(active_positive_configs) == 0
    ) or (
        raw_score < 0
    )

    if is_disqualified:
        temperature = "DISQUALIFIED"
    elif raw_score >= 75:
        temperature = "HOT"
    elif raw_score >= 45:
        temperature = "WARM"
    else:
        temperature = "COLD"

    # Clamped final lead score (0 to 100)
    lead_score = max(0, min(100, raw_score))

    # 5. Product Routing
    # Pick highest-weighted active positive signal
    if active_positive_configs:
        sorted_positives = sorted(active_positive_configs, key=lambda x: x["points"], reverse=True)
        recommended_product = sorted_positives[0]["product_wedge"]
    else:
        recommended_product = "Deel EOR & Contractor"

    return {
        "lead_score": lead_score,
        "raw_score": raw_score,
        "temperature": temperature,
        "recommended_product": recommended_product,
        "breakdown": breakdown
    }
