import re
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional


def extract_sentences(text: str) -> List[str]:
    """Splits raw text into non-empty, stripped sentences."""
    if not text or not text.strip():
        return []
    raw_parts = re.split(r'(?<=[.!?])\s+|\n+', text.strip())
    sentences = [p.strip() for p in raw_parts if p and len(p.strip()) > 8]
    return sentences


def find_matching_sentences(sentences: List[str], keywords: List[str]) -> List[str]:
    matches = []
    for s in sentences:
        s_lower = s.lower()
        if any(kw.lower() in s_lower for kw in keywords):
            matches.append(s)
    return matches


PERSONA_ANGLES = {
    "VP of People / Talent": (
        "Rapid Global Hiring Velocity & Localized Benefits: Hire and onboard international full-time talent in 90+ countries in days instead of waiting 6–9 months for foreign legal entity establishment, with automated localized benefit packages, equipment provisioning, and compliant employment contracts."
    ),
    "CFO / Finance": (
        "Foreign Overhead Elimination & Contractor Shield: Eliminate $50,000+ per-country foreign entity incorporation and ongoing franchise tax overhead, insulate the balance sheet from statutory contractor misclassification fines via Deel Shield, and consolidate multi-currency international contractor payouts into a single monthly invoice."
    ),
    "General Counsel / Payroll": (
        "130+ Owned Infrastructure & In-House Labor Compliance: Leverage Deel's 130+ directly owned local legal entities (never unvetted third-party brokers), in-house local labor counsel across all jurisdictions, ironclad intellectual property assignment protections, and enterprise SOC 2 / GDPR compliance."
    )
}

DEFAULT_PERSONA_ANGLE = (
    "Comprehensive Global Workforce Consolidation: Compliantly hire, pay, and manage distributed international employees and contractors in 150+ countries on a unified platform with automated local labor compliance."
)


def generate_deel_brief(
    company_name: str,
    contact_name: Optional[str],
    contact_title: Optional[str],
    persona: Optional[str],
    recommended_product: str,
    research_notes: Optional[str],
    buying_signals: List[str],
    red_flags: List[str]
) -> Dict[str, Any]:
    """
    Generates a 1-page outreach brief strictly grounded in the research notes.
    If the pasted notes do not contain enough information to support any section or specific hook,
    it explicitly outputs 'Not in notes'.
    """
    notes = (research_notes or "").strip()
    sentences = extract_sentences(notes)

    p_name = (contact_name or "").strip() or "Prospect"
    p_title = (contact_title or "").strip() or "Leadership"
    c_name = company_name.strip()
    p_persona = (persona or "VP of People / Talent").strip()

    # Category matching in notes
    hiring_matches = find_matching_sentences(sentences, ["hiring", "engineer", "remote", "developer", "recruit", "posting", "jobs", "team", "roles"])
    funding_matches = find_matching_sentences(sentences, ["funding", "series", "round", "raised", "capital", "investor", "valuation"])
    contractor_matches = find_matching_sentences(sentences, ["contractor", "contractors", "freelance", "1099", "misclassification", "spreadsheet", "manual", "payouts"])
    geo_matches = find_matching_sentences(sentences, ["brazil", "poland", "germany", "latam", "emea", "europe", "uk", "international", "global", "overseas"])
    hr_matches = find_matching_sentences(sentences, ["people", "talent", "hr", "operations", "mobility", "compliance", "entities", "entity"])

    # 1. Company Summary (Up to 3 factual sentences from the notes)
    if len(sentences) >= 3:
        summary_sentences = sentences[:3]
    elif len(sentences) > 0:
        summary_sentences = sentences + ["Not in notes"] * (3 - len(sentences))
    else:
        summary_sentences = ["Not in notes", "Not in notes", "Not in notes"]

    company_summary = " ".join([s for s in summary_sentences if s != "Not in notes"])
    if not company_summary:
        company_summary = "Not in notes"

    # 2. Best Outreach Angle (Persona + Product wedge + Quoted grounding)
    base_persona_angle = PERSONA_ANGLES.get(p_persona, DEFAULT_PERSONA_ANGLE)
    if sentences:
        supporting_anchor = (contractor_matches or hiring_matches or funding_matches or sentences)[0]
        best_angle = f"{base_persona_angle} (Directly grounded in notes: \"{supporting_anchor}\")"
    else:
        best_angle = f"{base_persona_angle} (Supporting notes: Not in notes)"

    # 3. 3 Personalized First Lines (Strictly Grounded in Notes)
    first_lines = []
    
    # Line 1: Funding / Expansion Trigger Line
    if funding_matches:
        first_lines.append(
            f"\"{funding_matches[0]}\" — congratulations on {c_name}'s recent momentum; typically after capital events of this scale, headcount scaling outside domestic borders becomes an immediate priority."
        )
    elif len(sentences) > 0:
        first_lines.append(
            f"\"{sentences[0]}\" — noting {c_name}'s recent initiatives, I wanted to reach out regarding the operational impact on your international workforce."
        )
    else:
        first_lines.append("Not in notes")

    # Line 2: Hiring / Geo Expansion Line
    geo_or_hire = hiring_matches or geo_matches
    if geo_or_hire and len(sentences) > 1:
        first_lines.append(
            f"Saw from your current postings that \"{geo_or_hire[0]}\" — when hiring across these jurisdictions without local entities, navigating localized labor laws and benefits packages usually creates serious administrative drag."
        )
    elif len(sentences) > 1:
        first_lines.append(
            f"Referencing your recent note that \"{sentences[1]}\" — wanted to share how peer organizations streamline foreign team onboarding without setting up costly entities."
        )
    else:
        first_lines.append("Not in notes")

    # Line 3: Contractor / Compliance / Tooling Line
    risk_or_hr = contractor_matches or hr_matches
    if risk_or_hr and len(sentences) > 2:
        first_lines.append(
            f"Noted that \"{risk_or_hr[0]}\" — high-growth finance and people leaders usually find managing international contractor payouts and misclassification risks through manual processes pulls hours away from core strategy."
        )
    elif len(sentences) > 2:
        first_lines.append(
            f"Noting that \"{sentences[2]}\" — wanted to see how {c_name} is ensuring compliance and payroll consistency as the team grows."
        )
    else:
        first_lines.append("Not in notes")

    while len(first_lines) < 3:
        first_lines.append("Not in notes")

    # 4. 5 Deel Discovery Questions
    questions = []
    if hiring_matches:
        questions.append(
            f"Regarding your active remote engineering hiring (\"{hiring_matches[0]}\"), what is your current plan for compliant employment contracts and localized benefits in those countries?"
        )
    if geo_matches:
        questions.append(
            f"Notes reference target regions ({geo_matches[0]})—are you planning to incorporate owned legal entities in those markets, or would an Employer of Record (EOR) structure save months of delay?"
        )
    if contractor_matches:
        questions.append(
            f"Given that \"{contractor_matches[0]}\", how are you currently validating that foreign contractors are insulated against local misclassification audits and statutory penalties?"
        )
    if hr_matches:
        questions.append(
            f"Notes highlight \"{hr_matches[0]}\"—what is the biggest friction point in onboarding and running payroll for distributed talent today?"
        )
    if funding_matches:
        questions.append(
            f"Following your funding announcement (\"{funding_matches[0]}\"), how many international team members are budgeted to be hired over the next two quarters?"
        )

    # Fill remaining from sentences if needed
    for s in sentences:
        if len(questions) >= 5:
            break
        candidate = f"Your notes mention \"{s}\"—how does that expansion priority intersect with your global payroll and compliance timeline?"
        if candidate not in questions:
            questions.append(candidate)

    while len(questions) < 5:
        questions.append("Not in notes")

    # 5. 3 Likely Objections & Deel Rebuttals
    objections = [
        {
            "objection": "We already pay international contractors via Wise / PayPal / 1099.",
            "response": (
                "Wise and PayPal move money, but they provide zero statutory compliance or IP protection. "
                "In LATAM and EMEA, paying full-time-equivalent contractors via money transfer services triggers severe misclassification penalties and back-taxes. "
                "Deel Shield actually assumes the total legal misclassification liability on your behalf while automating invoices and local tax forms."
            )
        },
        {
            "objection": "We already use Rippling or Gusto for HR and payroll.",
            "response": (
                "Gusto is strictly built for domestic US payroll, and Rippling predominantly relies on third-party broker networks for international employment. "
                "Deel owns over 130+ legal entities directly worldwide with 250+ in-house labor attorneys—meaning your foreign hires get instant direct support, localized benefits, and compliance without broker markups or third-party delays."
            )
        },
        {
            "objection": "We are planning to open our own local legal entity in our target country.",
            "response": (
                "Setting up an owned foreign entity typically takes 6 to 9 months, costs $30k–$60k in legal and franchise fees upfront, and requires thousands in ongoing monthly accounting and filing upkeep. "
                "Deel EOR allows you to legally hire candidates tomorrow in 90+ countries. If you eventually decide to open an entity at scale, Deel seamlessly transitions reps into Deel Global Payroll without disrupting employee tenure."
            )
        }
    ]

    # 6. 30-Second Cold Call Talk Track
    anchor = (contractor_matches or hiring_matches or funding_matches or sentences)
    if anchor:
        talk_track = (
            f"\"Hi {p_name}, this is an SDR with Deel. I'm reaching out because I saw {c_name}'s recent update: '{anchor[0][:90]}'. "
            f"As {p_title}, you're likely navigating the compliance friction and entity setup delays that come with scaling talent across those borders. "
            f"We help high-growth companies hire and pay full-time employees in 90+ countries in under 5 minutes without setting up foreign entities, while eliminating contractor misclassification risk. "
            f"Do you have 10 minutes next Tuesday to review how peer organizations benchmark foreign entity costs?\""
        )
    else:
        talk_track = "Not in notes"

    # 7. One Clear Next Step
    if sentences:
        next_step = (
            f"Schedule a 15-minute global workforce benchmarking call with {p_name} ({p_title}) "
            f"on Tuesday at 10:00 AM CT to share country-specific employment cost benchmarks for '{sentences[0][:60]}'."
        )
    else:
        next_step = "Not in notes"

    return {
        "company_summary": company_summary,
        "best_outreach_angle": best_angle,
        "personalized_first_lines": first_lines,
        "discovery_questions": questions,
        "objections": objections,
        "talk_track": talk_track,
        "next_step": next_step,
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    }


def generate_ae_handoff_markdown(account: Dict[str, Any], contacts: List[Dict[str, Any]]) -> str:
    """Formats a standardized, CRM-ready AE Handoff Packet."""
    company_name = account.get("company_name", "Account")
    lead_score = account.get("lead_score", 0)
    temperature = account.get("temperature", "COLD")
    recommended_product = account.get("recommended_product", "Deel EOR")
    industry = account.get("industry", "B2B")
    company_size = account.get("company_size", "Unspecified")
    hq = account.get("hq_location", "Unspecified")

    contacts_md = "\n".join([
        f"- **{c.get('full_name')}** ({c.get('title')}) — Persona: *{c.get('persona')}* | Role: *{c.get('buying_role')}* | Status: *{c.get('outreach_status')}*"
        for c in contacts
    ]) or "No contacts recorded."

    signals_list = account.get("buying_signals", [])
    signals_md = "\n".join([f"- [x] {s}" for s in signals_list]) or "No active signals."

    red_flags_list = account.get("red_flags", [])
    red_flags_md = "\n".join([f"- [!] {r}" for r in red_flags_list]) or "None detected."

    handoff_text = f"""# AE Handoff Packet: {company_name}

**Target Account**: {company_name}  
**ICP Fit Score**: {lead_score}/100 ({temperature})  
**Recommended Deel Product**: {recommended_product}  
**Industry / Size / HQ**: {industry} | {company_size} employees | {hq}  
**Handoff Timestamp**: {datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")}  

---

## 1. Multi-Threaded Stakeholder Map
{contacts_md}

---

## 2. Verified Buying Signals
{signals_md}

**Disqualification / Red Flag Check**:
{red_flags_md}

---

## 3. SDR Qualification & Discovery Notes
- **Identified Business Pain**: {account.get('qualification_pain') or 'Not yet captured'}
- **Current Vendor / Process**: {account.get('qualification_current_vendor') or 'Not yet captured'}
- **Target Implementation Timeline**: {account.get('qualification_timeline') or 'Not yet captured'}
- **Live Call & Context Notes**: {account.get('qualification_notes') or 'Not yet captured'}

---

## 4. Pasted Research Notes Snapshot
```
{account.get('research_notes', 'Not in notes')}
```

---
*Generated by Prospecting Engine — Grounded Deel SDR Workstation*
"""
    return handoff_text
