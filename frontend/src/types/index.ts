export interface Contact {
  id: number;
  account_id: number;
  full_name: string;
  title: string;
  persona: 'VP of People / Talent' | 'CFO / Finance' | 'General Counsel / Payroll' | string;
  buying_role: 'Champion' | 'Economic Buyer' | 'Legal / Technical Evaluator' | string;
  linkedin_url?: string | null;
  outreach_status: 'Not Contacted' | 'Email Sent' | 'Called' | 'Replied' | 'Meeting Booked' | string;
}

export interface CallLog {
  id: number;
  account_id: number;
  contact_name?: string | null;
  outcome: 'No Answer' | 'Gatekeeper' | 'Pitched - Not Interested' | 'Follow-Up Requested' | 'Meeting Booked';
  notes?: string | null;
  logged_at: string;
}

export interface ScoreBreakdownItem {
  factor: string;
  category: string;
  points: number;
  max_points: number;
  earned: boolean;
  description: string;
}

export interface ScoreDetails {
  lead_score: number;
  raw_score: number;
  temperature: 'HOT' | 'WARM' | 'COLD' | 'DISQUALIFIED';
  recommended_product: string;
  breakdown: ScoreBreakdownItem[];
}

export interface Account {
  id: number;
  company_name: string;
  website?: string | null;
  industry?: string | null;
  company_size: string;
  hq_location?: string | null;
  research_notes: string;
  buying_signals: string[];
  red_flags: string[];
  lead_score: number;
  temperature: 'HOT' | 'WARM' | 'COLD' | 'DISQUALIFIED';
  recommended_product: string;
  status: 'New' | 'Ready' | 'Contacted' | 'Replied' | 'Meeting';
  cadence_step: number;
  follow_up_due?: string | null;
  qualification_pain?: string | null;
  qualification_current_vendor?: string | null;
  qualification_timeline?: string | null;
  qualification_notes?: string | null;
  is_sample: number;
  created_at: string;
  contacts: Contact[];
  call_logs?: CallLog[];
  score_details?: ScoreDetails;
}

export interface BriefObjection {
  objection: string;
  response: string;
}

export interface BriefData {
  account_id: number;
  company_name: string;
  contact_name: string;
  contact_title: string;
  persona: string;
  recommended_product: string;
  company_summary: string;
  best_outreach_angle: string;
  personalized_first_lines: string[];
  discovery_questions: string[];
  objections: BriefObjection[];
  talk_track: string;
  next_step: string;
  generated_at: string;
}

export interface DashboardAnalytics {
  total_accounts: number;
  hot_count: number;
  warm_count: number;
  cold_count: number;
  disqualified_count: number;
  meetings_count: number;
  due_today_count: number;
  status_counts: Record<string, number>;
  temperature_counts: Record<string, number>;
  funnel_counts: Record<string, number>;
  average_score: number;
}

export interface CreateAccountPayload {
  company_name: string;
  website?: string;
  industry?: string;
  company_size: string;
  hq_location?: string;
  research_notes: string;
  primary_contact_name?: string;
  primary_contact_title?: string;
  primary_contact_persona?: string;
  primary_contact_role?: string;
  primary_contact_linkedin?: string;
}
