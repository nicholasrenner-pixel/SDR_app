import json
from sqlalchemy.orm import Session
from .models import Account, BuyingSignal, Brief
from .scoring import calculate_lead_score, SIGNALS_CONFIG
from .brief_generator import generate_grounded_brief


SAMPLE_COMPANY_NAME = "Acme Freight Technologies [SAMPLE]"
SAMPLE_SLUG = "acme-freight-technologies-sample"

SAMPLE_RESEARCH_NOTES = (
    "Q3 Press Release: Acme Freight Technologies closed a $45M Series C funding round led by Horizon Peak Ventures to accelerate automated cross-border logistics. "
    "Executive Appointment: Marcus Vance joined last month as VP of Sales & Revenue Operations from Flexport to build out enterprise outbound GTM. "
    "Careers Page Audit: Actively hiring 8 Enterprise SDRs and 5 Account Executives in Chicago, alongside launching international sales teams in London and Frankfurt. "
    "Tech Stack & Competitor: Notes from senior SDR job postings confirm they currently use Outreach.io and Salesforce, but international reps report heavy manual friction managing cross-border compliance, multi-currency reporting, and local payroll across UK and EU entities. "
    "Headcount Growth: Headcount has surged 38% over the past 9 months, jumping from 310 to 430 employees. Leadership posted that administrative compliance overhead is slowing down sales rep onboarding."
)

SAMPLE_SIGNALS = {
    "hiring_sdrs_aes": True,
    "hiring_internationally": True,
    "new_funding": True,
    "new_leadership": True,
    "using_competitor": True,
    "expanding_countries": True,
    "payroll_compliance_pain": True,
    "headcount_growing_fast": True
}


def seed_sample_data_if_empty(db: Session):
    """Checks if database has accounts; if not, seeds the realistic sample account."""
    existing_sample = db.query(Account).filter(Account.is_sample == True).first()
    if existing_sample:
        return existing_sample

    # Calculate score
    score_data = calculate_lead_score(SAMPLE_SIGNALS, "201-1000")
    
    # Generate brief
    brief_data = generate_grounded_brief(
        company_name=SAMPLE_COMPANY_NAME,
        prospect_name="Marcus Vance",
        prospect_title="VP of Sales & Revenue Operations",
        research_notes=SAMPLE_RESEARCH_NOTES,
        active_signals=SAMPLE_SIGNALS
    )

    sample_account = Account(
        company_name=SAMPLE_COMPANY_NAME,
        company_slug=SAMPLE_SLUG,
        website="https://acmefreight.example.com",
        industry="Supply Chain & Logistics",
        company_size="201-1000",
        location="Chicago, IL",
        prospect_name="Marcus Vance",
        prospect_title="VP of Sales & Revenue Operations",
        linkedin_url="https://linkedin.com/in/marcus-vance-sample",
        research_notes=SAMPLE_RESEARCH_NOTES,
        lead_score=score_data["total_score"],
        temperature=score_data["temperature"],
        status="Ready",
        is_sample=True
    )
    db.add(sample_account)
    db.flush()

    # Add signals
    for key in SIGNALS_CONFIG.keys():
        is_act = SAMPLE_SIGNALS.get(key, False)
        sig = BuyingSignal(
            account_id=sample_account.id,
            signal_key=key,
            is_active=is_act
        )
        db.add(sig)

    # Add brief
    brief = Brief(
        account_id=sample_account.id,
        content_json=json.dumps(brief_data)
    )
    db.add(brief)

    db.commit()
    db.refresh(sample_account)
    return sample_account


def delete_all_sample_data(db: Session) -> int:
    """Deletes all sample accounts and cascades to signals and briefs."""
    samples = db.query(Account).filter(Account.is_sample == True).all()
    count = len(samples)
    for sample in samples:
        db.delete(sample)
    db.commit()
    return count
