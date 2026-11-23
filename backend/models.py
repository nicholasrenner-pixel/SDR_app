from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict


class ContactBase(BaseModel):
    full_name: str
    title: str
    persona: str  # 'VP of People / Talent', 'CFO / Finance', 'General Counsel / Payroll'
    buying_role: str  # 'Champion', 'Economic Buyer', 'Legal / Technical Evaluator'
    linkedin_url: Optional[str] = None
    outreach_status: Optional[str] = "Not Contacted"


class ContactCreate(ContactBase):
    pass


class ContactResponse(ContactBase):
    id: int
    account_id: int

    model_config = ConfigDict(from_attributes=True)


class CallLogBase(BaseModel):
    contact_name: Optional[str] = None
    outcome: str  # 'No Answer', 'Gatekeeper', 'Pitched - Not Interested', 'Follow-Up Requested', 'Meeting Booked'
    notes: Optional[str] = None


class CallLogCreate(CallLogBase):
    pass


class CallLogResponse(CallLogBase):
    id: int
    account_id: int
    logged_at: str

    model_config = ConfigDict(from_attributes=True)


class ScoreBreakdownItem(BaseModel):
    factor: str
    category: str
    points: int
    max_points: int
    earned: bool
    description: str


class ScoreResponse(BaseModel):
    lead_score: int
    raw_score: int
    temperature: str
    recommended_product: str
    breakdown: List[ScoreBreakdownItem]


class AccountCreate(BaseModel):
    company_name: str
    website: Optional[str] = None
    industry: Optional[str] = None
    company_size: str = "201-1000"  # '1-50', '51-200', '201-1000', '1001-5000', '5000+'
    hq_location: Optional[str] = None
    research_notes: str
    # Initial primary contact info
    primary_contact_name: Optional[str] = None
    primary_contact_title: Optional[str] = None
    primary_contact_persona: Optional[str] = "VP of People / Talent"
    primary_contact_role: Optional[str] = "Champion"
    primary_contact_linkedin: Optional[str] = None


class AccountUpdate(BaseModel):
    company_name: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    hq_location: Optional[str] = None
    research_notes: Optional[str] = None
    status: Optional[str] = None
    cadence_step: Optional[int] = None
    follow_up_due: Optional[str] = None
    qualification_pain: Optional[str] = None
    qualification_current_vendor: Optional[str] = None
    qualification_timeline: Optional[str] = None
    qualification_notes: Optional[str] = None


class SignalsUpdateRequest(BaseModel):
    buying_signals: List[str]
    red_flags: List[str]


class BriefObjection(BaseModel):
    objection: str
    response: str


class BriefResponse(BaseModel):
    account_id: int
    company_name: str
    contact_name: str
    contact_title: str
    persona: str
    recommended_product: str
    company_summary: str
    best_outreach_angle: str
    personalized_first_lines: List[str]
    discovery_questions: List[str]
    objections: List[BriefObjection]
    talk_track: str
    next_step: str
    generated_at: str


class AccountResponse(BaseModel):
    id: int
    company_name: str
    website: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    hq_location: Optional[str] = None
    research_notes: str
    buying_signals: List[str] = []
    red_flags: List[str] = []
    lead_score: int
    temperature: str
    recommended_product: str
    status: str
    cadence_step: int
    follow_up_due: Optional[str] = None
    qualification_pain: Optional[str] = None
    qualification_current_vendor: Optional[str] = None
    qualification_timeline: Optional[str] = None
    qualification_notes: Optional[str] = None
    is_sample: int
    created_at: str
    contacts: List[ContactResponse] = []
    call_logs: List[CallLogResponse] = []
    score_details: Optional[ScoreResponse] = None

    model_config = ConfigDict(from_attributes=True)


class DashboardAnalytics(BaseModel):
    total_accounts: int
    hot_count: int
    warm_count: int
    cold_count: int
    disqualified_count: int
    meetings_count: int
    due_today_count: int
    status_counts: Dict[str, int]
    temperature_counts: Dict[str, int]
    funnel_counts: Dict[str, int]
    average_score: float
