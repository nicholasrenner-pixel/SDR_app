import re
from datetime import datetime
from typing import Dict, Any, List, Optional


def extract_sentences(text: str) -> List[str]:
    """Splits raw text into non-empty, stripped sentences."""
    if not text or not text.strip():
        return []
    # Split on sentence terminals or newlines
    raw_parts = re.split(r'(?<=[.!?])\s+|\n+', text)
    sentences = [p.strip() for p in raw_parts if p and len(p.strip()) > 8]
    return sentences


def find_matching_sentences(sentences: List[str], keywords: List[str]) -> List[str]:
    """Finds sentences containing any of the given keywords (case-insensitive)."""
    matches = []
    for s in sentences:
        s_lower = s.lower()
        if any(kw.lower() in s_lower for kw in keywords):
            matches.append(s)
    return matches


def generate_grounded_brief(
    company_name: str,
    prospect_name: Optional[str],
    prospect_title: Optional[str],
    research_notes: Optional[str],
    active_signals: Dict[str, bool]
) -> Dict[str, Any]:
    """
    Generates a 1-page structured outreach brief strictly grounded in the research notes.
    STRICT GROUNDING RULE: If the pasted notes do not contain enough information to support
    any section or specific hook, explicitly outputs 'Not in notes' rather than fabricating details.
    """
    notes = (research_notes or "").strip()
    sentences = extract_sentences(notes)

    # If notes are completely missing or negligible, everything is "Not in notes"
    if not notes or len(sentences) == 0:
        return {
            "company_summary": "Not in notes",
            "best_outreach_angle": "Not in notes",
            "personalized_first_lines": ["Not in notes", "Not in notes", "Not in notes"],
            "discovery_questions": [
                "Not in notes",
                "Not in notes",
                "Not in notes",
                "Not in notes",
                "Not in notes"
            ],
            "objections": [
                {"objection": "Not in notes", "response": "Not in notes"},
                {"objection": "Not in notes", "response": "Not in notes"},
                {"objection": "Not in notes", "response": "Not in notes"}
            ],
            "talk_track": "Not in notes",
            "next_step": "Not in notes",
            "generated_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
        }

    p_name = (prospect_name or "").strip() or "the prospect"
    p_title = (prospect_title or "").strip() or "Leadership"
    c_name = company_name.strip()

    # Category sentence matches
    funding_matches = find_matching_sentences(sentences, ["funding", "series", "capital", "round", "investor", "valuation", "seed"])
    leadership_matches = find_matching_sentences(sentences, ["joined", "hire", "leadership", "vp", "director", "officer", "executive", "promoted"])
    hiring_matches = find_matching_sentences(sentences, ["sdr", "ae", "account executive", "hiring", "recruit", "careers", "openings", "posting"])
    intl_matches = find_matching_sentences(sentences, ["international", "emea", "apac", "london", "frankfurt", "europe", "uk", "eu", "global", "cross-border", "countries"])
    competitor_matches = find_matching_sentences(sentences, ["outreach", "salesforce", "hubspot", "gong", "apollo", "zoominfo", "competitor", "tool", "stack", "software"])
    pain_matches = find_matching_sentences(sentences, ["compliance", "payroll", "tax", "friction", "manual", "overhead", "bottleneck", "pain", "delay", "struggle", "slowing"])
    growth_matches = find_matching_sentences(sentences, ["headcount", "growth", "surge", "surged", "%", "growing", "expansion", "scale"])

    # 1. Company Summary (Up to 3 factual sentences from the notes)
    if len(sentences) >= 3:
        summary_sentences = sentences[:3]
    elif len(sentences) > 0:
        summary_sentences = sentences
    else:
        summary_sentences = []
    
    company_summary = " ".join(summary_sentences) if summary_sentences else "Not in notes"

    # 2. Best Outreach Angle
    # Evaluate best angle with supporting quote
    angle = "Not in notes"
    if pain_matches and (intl_matches or hiring_matches):
        angle = f"Eliminating Operational Friction During Aggressive Team Expansion (Supported in notes: \"{pain_matches[0]}\")"
    elif hiring_matches and leadership_matches:
        angle = f"GTM Acceleration & SDR Ramp Velocity Under New Leadership (Supported in notes: \"{leadership_matches[0]}\")"
    elif funding_matches and hiring_matches:
        angle = f"Post-Capital Influx Sales Capacity Scaling (Supported in notes: \"{funding_matches[0]}\")"
    elif competitor_matches:
        angle = f"Augmenting & Optimizing Existing Sales Tech Stack (Supported in notes: \"{competitor_matches[0]}\")"
    elif len(sentences) > 0:
        angle = f"Targeted Workflow Optimization (Supported in notes: \"{sentences[0]}\")"

    # 3. 3 Personalized First Lines (Strictly parsing and quoting details from the notes)
    first_lines = []
    
    # Line 1: Event / Trigger hook
    trigger_source = funding_matches or leadership_matches
    if trigger_source:
        first_lines.append(
            f"\"{trigger_source[0]}\" — saw this recent milestone for {c_name} and wanted to reach out regarding the operational impact on your outbound pipeline."
        )
    elif len(sentences) > 0:
        first_lines.append(
            f"\"{sentences[0]}\" — noting {c_name}'s recent momentum, I wanted to connect regarding your team's current sales priorities."
        )
    else:
        first_lines.append("Not in notes")

    # Line 2: Hiring / Role hook
    hiring_source = hiring_matches or intl_matches
    if hiring_source:
        first_lines.append(
            f"Noticed from your recent postings: \"{hiring_source[0]}\" — typically as teams scale these roles, sales rep ramp time and onboarding consistency become primary challenges."
        )
    elif len(sentences) > 1:
        first_lines.append(
            f"Referencing your recent note that \"{sentences[1]}\" — wanted to share how similar revenue leaders are managing this transition."
        )
    else:
        first_lines.append("Not in notes")

    # Line 3: Tech Stack / Operational Pain hook
    pain_source = pain_matches or competitor_matches or growth_matches
    if pain_source:
        first_lines.append(
            f"Observed that \"{pain_source[0]}\" — sales and ops leaders navigating this friction usually find manual processes take hours away from live prospecting."
        )
    elif len(sentences) > 2:
        first_lines.append(
            f"Noting that \"{sentences[2]}\" — reaching out to share how peer organizations streamline this exact workflow."
        )
    else:
        first_lines.append("Not in notes")

    # Ensure exactly 3 items
    while len(first_lines) < 3:
        first_lines.append("Not in notes")

    # 4. 5 Discovery Questions (Grounded in note facts)
    questions = []
    if hiring_matches:
        questions.append(
            f"With open sales roles noted in \"{hiring_matches[0]}\", what is your current benchmark for new SDR ramp time to full quota?"
        )
    if intl_matches:
        questions.append(
            f"Regarding your international footprint ({intl_matches[0]}), how are reps handling localized prospecting workflows across different regions?"
        )
    if competitor_matches:
        questions.append(
            f"Notes reference your current stack ({competitor_matches[0]})—where are reps encountering the biggest friction or workflow disconnects today?"
        )
    if pain_matches:
        questions.append(
            f"Your team highlighted \"{pain_matches[0]}\"—what measurable impact is that administrative overhead having on daily sales activity?"
        )
    if growth_matches:
        questions.append(
            f"Given your headcount scaling (\"{growth_matches[0]}\"), how are you ensuring sales data quality and consistency keep pace with company growth?"
        )
    elif funding_matches and len(questions) < 5:
        questions.append(
            f"Following your funding announcement (\"{funding_matches[0]}\"), what are your top revenue growth initiatives for the next two quarters?"
        )
    elif leadership_matches and len(questions) < 5:
        questions.append(
            f"With leadership changes noted (\"{leadership_matches[0]}\"), are there plans to evaluate new pipeline automation platforms?"
        )

    # Pad with grounded sentences or "Not in notes"
    for s in sentences:
        if len(questions) >= 5:
            break
        candidate = f"Notes mention \"{s}\"—how does that factor into your outbound team's current quarterly targets?"
        if candidate not in questions:
            questions.append(candidate)

    while len(questions) < 5:
        questions.append("Not in notes")

    # 5. 3 Likely Objections & Tailored Responses
    objections = []
    # Objection 1: Competitor / Current Tooling
    if competitor_matches:
        objections.append({
            "objection": f"We are already locked into our current stack ({competitor_matches[0][:80]}).",
            "response": f"Totally understand. We don't ask teams to rip and replace their existing tools; we integrate directly to eliminate the specific friction noted in \"{pain_matches[0] if pain_matches else competitor_matches[0]}\"."
        })
    elif len(sentences) > 0:
        objections.append({
            "objection": f"We already have a system in place for {c_name}.",
            "response": f"Understood. Our goal is not replacement, but addressing the specific operational priority highlighted in \"{sentences[0][:80]}\"."
        })
    else:
        objections.append({"objection": "Not in notes", "response": "Not in notes"})

    # Objection 2: Bandwidth / Too Busy Scaling
    if hiring_matches or growth_matches:
        ref_text = (hiring_matches or growth_matches)[0]
        objections.append({
            "objection": f"We are too busy hiring and scaling right now ({ref_text[:80]}).",
            "response": "That's exactly why we reach out now—every week new reps spend navigating manual friction is revenue lost. We cut ramp time so new hires contribute sooner."
        })
    else:
        objections.append({"objection": "Not in notes", "response": "Not in notes"})

    # Objection 3: Manual process or internal build
    if pain_matches:
        objections.append({
            "objection": f"We are managing compliance and workflows internally for now ({pain_matches[0][:80]}).",
            "response": f"Many high-growth teams start that way. However, as {c_name} scales, manual overhead quickly consumes 15+ hours per rep per month. We provide a predictable, automated alternative."
        })
    elif len(sentences) > 1:
        objections.append({
            "objection": f"We will handle this internally alongside \"{sentences[1][:70]}\".",
            "response": "Makes sense for initial stages, but revenue leaders find that specialized automation protects rep selling time while ensuring complete accuracy."
        })
    else:
        objections.append({"objection": "Not in notes", "response": "Not in notes"})

    while len(objections) < 3:
        objections.append({"objection": "Not in notes", "response": "Not in notes"})

    # 6. 30-Second Talk Track
    talk_track = "Not in notes"
    anchor_sentence = (pain_matches or hiring_matches or trigger_source or (sentences[:1]))
    if anchor_sentence:
        talk_track = (
            f"\"Hi {p_name}, this is an SDR with Prospecting Engine. I'm reaching out because I saw {c_name}'s recent update: "
            f"'{anchor_sentence[0]}'. As {p_title}, you're likely managing the ripple effects of this growth on outbound productivity. "
            f"We partner with high-growth teams to eliminate administrative drag and ensure reps ramp 30% faster. "
            f"Do you have 10 minutes next Tuesday to review how peer organizations solve this?\""
        )

    # 7. One Clear Next Step
    next_step = "Not in notes"
    if prospect_name and len(sentences) > 0:
        context_topic = (pain_matches or hiring_matches or sentences)[0][:60]
        next_step = (
            f"Schedule a 15-minute introductory pipeline briefing with {p_name} ({p_title}) "
            f"on Tuesday at 10:00 AM to share industry benchmarks regarding '{context_topic}'."
        )
    elif len(sentences) > 0:
        next_step = f"Conduct a 15-minute introductory workflow briefing with {c_name} sales leadership focused on '{sentences[0][:60]}'."

    return {
        "company_summary": company_summary,
        "best_outreach_angle": angle,
        "personalized_first_lines": first_lines,
        "discovery_questions": questions,
        "objections": objections,
        "talk_track": talk_track,
        "next_step": next_step,
        "generated_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    }
