from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict
from datetime import datetime


class BuyingSignalItem(BaseModel):
    signal_key: str
    is_active: bool


class ScoreBreakdownItem(BaseModel):
    factor: str
    category: str
    points_awarded: int
    max_points: int
    earned: bool
    explanation: str


class ScoreResponse(BaseModel):
    total_score: int
    temperature: str
    items: List[ScoreBreakdownItem]


class AccountBase(BaseModel):
    company_name: str
    website: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    location: Optional[str] = None
    prospect_name: Optional[str] = None
    prospect_title: Optional[str] = None
    linkedin_url: Optional[str] = None
    research_notes: Optional[str] = ""
    status: Optional[str] = "New"


class AccountCreate(AccountBase):
    pass


class AccountUpdate(BaseModel):
    company_name: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    location: Optional[str] = None
    prospect_name: Optional[str] = None
    prospect_title: Optional[str] = None
    linkedin_url: Optional[str] = None
    research_notes: Optional[str] = None
    status: Optional[str] = None


class SignalsUpdateRequest(BaseModel):
    signals: Dict[str, bool]


class BriefSection(BaseModel):
    company_summary: str
    best_outreach_angle: str
    personalized_first_lines: List[str]
    discovery_questions: List[str]
    objections: List[Dict[str, str]]
    talk_track: str
    next_step: str
    generated_at: str


class AccountResponse(AccountBase):
    id: int
    company_slug: str
    lead_score: int
    temperature: str
    is_sample: bool
    created_at: datetime
    updated_at: datetime
    signals: Dict[str, bool] = {}
    brief: Optional[BriefSection] = None
    score_breakdown: Optional[ScoreResponse] = None

    model_config = ConfigDict(from_attributes=True)


class DashboardAnalytics(BaseModel):
    total_accounts: int
    hot_count: int
    warm_count: int
    cold_count: int
    status_counts: Dict[str, int]
    temperature_counts: Dict[str, int]
    funnel_counts: Dict[str, int]
    average_score: float
