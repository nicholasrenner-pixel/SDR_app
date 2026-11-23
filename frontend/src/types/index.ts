export interface BuyingSignalItem {
  key: string;
  name: string;
  category: string;
  points: number;
  description: string;
}

export interface ScoreBreakdownItem {
  factor: string;
  category: string;
  points_awarded: number;
  max_points: number;
  earned: boolean;
  explanation: string;
}

export interface ScoreBreakdown {
  total_score: number;
  temperature: 'HOT' | 'WARM' | 'COLD';
  items: ScoreBreakdownItem[];
}

export interface BriefObjection {
  objection: string;
  response: string;
}

export interface BriefData {
  company_summary: string;
  best_outreach_angle: string;
  personalized_first_lines: string[];
  discovery_questions: string[];
  objections: BriefObjection[];
  talk_track: string;
  next_step: string;
  generated_at: string;
}

export interface Account {
  id: number;
  company_name: string;
  company_slug: string;
  website: string | null;
  industry: string | null;
  company_size: string | null;
  location: string | null;
  prospect_name: string | null;
  prospect_title: string | null;
  linkedin_url: string | null;
  research_notes: string;
  lead_score: number;
  temperature: 'HOT' | 'WARM' | 'COLD';
  status: 'New' | 'Ready' | 'Contacted' | 'Replied' | 'Meeting';
  is_sample: boolean;
  created_at: string;
  updated_at: string;
  signals: Record<string, boolean>;
  brief: BriefData | null;
  score_breakdown?: ScoreBreakdown;
}

export interface DashboardAnalytics {
  total_accounts: number;
  hot_count: number;
  warm_count: number;
  cold_count: number;
  status_counts: Record<string, number>;
  temperature_counts: Record<string, number>;
  funnel_counts: Record<string, number>;
  average_score: number;
}

export interface CreateAccountPayload {
  company_name: string;
  website?: string;
  industry?: string;
  company_size?: string;
  location?: string;
  prospect_name?: string;
  prospect_title?: string;
  linkedin_url?: string;
  research_notes?: string;
  status?: string;
}
