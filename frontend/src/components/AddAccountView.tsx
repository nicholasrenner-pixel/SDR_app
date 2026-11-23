import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  User, 
  Globe, 
  MapPin, 
  ArrowLeft, 
  Sparkles, 
  Play, 
  Pause, 
  RotateCcw, 
  Timer, 
  CheckCircle2 
} from 'lucide-react';
import type { CreateAccountPayload } from '../types';

interface AddAccountViewProps {
  onBack: () => void;
  onSubmit: (payload: CreateAccountPayload) => Promise<void>;
}

export const AddAccountView: React.FC<AddAccountViewProps> = ({ onBack, onSubmit }) => {
  const [loading, setLoading] = useState(false);

  // 3:00 Research Timer state (180 seconds)
  const [secondsLeft, setSecondsLeft] = useState(180);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (timerRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => Math.max(0, prev - 1));
      }, 1000);
    } else if (secondsLeft === 0) {
      setTimerRunning(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning, secondsLeft]);

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const [formData, setFormData] = useState<CreateAccountPayload>({
    company_name: '',
    website: '',
    industry: 'Enterprise Software / B2B SaaS',
    company_size: '201-1000',
    hq_location: '',
    research_notes: '',
    primary_contact_name: '',
    primary_contact_title: '',
    primary_contact_persona: 'VP of People / Talent',
    primary_contact_role: 'Champion',
    primary_contact_linkedin: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company_name.trim() || !formData.research_notes.trim()) return;

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header with 3:00 Research Timer Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Target Accounts</span>
        </button>

        {/* 3x3 Rule Research Timer */}
        <div className="flex items-center space-x-3 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700">
            <Timer className={`w-4 h-4 ${secondsLeft === 0 ? 'text-rose-600' : 'text-blue-600'}`} />
            <span>3x3 Research Timer:</span>
          </div>
          <span className={`text-base font-black font-mono tabular-nums ${
            secondsLeft === 0 ? 'text-rose-600 animate-pulse' : 'text-slate-900'
          }`}>
            {formatTimer(secondsLeft)}
          </span>
          <div className="flex items-center space-x-1 pl-1">
            <button
              type="button"
              onClick={() => setTimerRunning(!timerRunning)}
              className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title={timerRunning ? 'Pause Timer' : 'Start Timer'}
            >
              {timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => {
                setTimerRunning(false);
                setSecondsLeft(180);
              }}
              className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Reset Timer (03:00)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Add Target Account</h2>
            <p className="text-xs text-slate-500 mt-1">
              Apply the 3x3 prospecting rule (3 facts in 3 minutes) to qualify and map this account to the ideal Deel wedge.
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
            Deel Qualification
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Section 1: Company Profile */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              1. Organization Profile
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Company Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="company_name"
                    required
                    placeholder="e.g. Veloce Cloud Systems"
                    value={formData.company_name}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Website URL
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="website"
                    placeholder="e.g. https://velocecloud.io"
                    value={formData.website}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Industry Vertical
                </label>
                <select
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                >
                  <option value="Enterprise Software / B2B SaaS">Enterprise Software / B2B SaaS</option>
                  <option value="Fintech & Payments">Fintech & Payments</option>
                  <option value="Supply Chain & Logistics">Supply Chain & Logistics</option>
                  <option value="Healthcare & Life Sciences">Healthcare & Life Sciences</option>
                  <option value="E-Commerce & Marketplaces">E-Commerce & Marketplaces</option>
                  <option value="Manufacturing & Hardware">Manufacturing & Hardware</option>
                  <option value="Media & Professional Services">Media & Professional Services</option>
                  <option value="Other High-Growth B2B">Other High-Growth B2B</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Company Size (Deel ICP Tier)
                </label>
                <select
                  name="company_size"
                  value={formData.company_size}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                >
                  <option value="201-1000">201–1,000 employees (Deel Sweet Spot: +20 pts)</option>
                  <option value="51-200">51–200 employees (Deel High Agility: +20 pts)</option>
                  <option value="1-50">1–50 employees (Early Stage / Contractor: +15 pts)</option>
                  <option value="1001-5000">1,001–5,000 employees (Global Payroll Consolidation: +10 pts)</option>
                  <option value="5000+">5,000+ employees (Enterprise Tier: +5 pts)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Headquarters Location
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="hq_location"
                    placeholder="e.g. Austin, TX (or San Francisco, CA / London, UK)"
                    value={formData.hq_location}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Primary Stakeholder */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              2. Initial Primary Contact (Multi-Threading Setup)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="primary_contact_name"
                    placeholder="e.g. Elena Rostova"
                    value={formData.primary_contact_name}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  name="primary_contact_title"
                  placeholder="e.g. VP of People & Talent"
                  value={formData.primary_contact_title}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deel Persona
                </label>
                <select
                  name="primary_contact_persona"
                  value={formData.primary_contact_persona}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                >
                  <option value="VP of People / Talent">VP of People / Talent (Champion)</option>
                  <option value="CFO / Finance">CFO / Finance (Economic Buyer)</option>
                  <option value="General Counsel / Payroll">General Counsel / Payroll (Evaluator)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Buying Role
                </label>
                <select
                  name="primary_contact_role"
                  value={formData.primary_contact_role}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                >
                  <option value="Champion">Champion</option>
                  <option value="Economic Buyer">Economic Buyer</option>
                  <option value="Legal / Technical Evaluator">Legal / Technical Evaluator</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  LinkedIn URL (Optional)
                </label>
                <input
                  type="text"
                  name="primary_contact_linkedin"
                  placeholder="https://linkedin.com/in/prospect"
                  value={formData.primary_contact_linkedin}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Paste Research Notes */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                3. Pasted Research Notes (Strict Grounding Source) <span className="text-rose-500">*</span>
              </h3>
              <span className="text-[11px] text-blue-600 font-semibold flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Zero Hallucination Guaranteed</span>
              </span>
            </div>

            <div>
              <textarea
                name="research_notes"
                required
                rows={8}
                placeholder="Paste raw job descriptions, foreign role postings (e.g. Remote in Poland/Brazil), recent funding rounds, international contractor details, or LinkedIn executive quotes here... Only facts pasted here will be used in your outreach brief."
                value={formData.research_notes}
                onChange={handleChange}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 leading-relaxed"
              />
              <p className="text-[11px] text-slate-500 mt-1.5">
                Note: The engine automatically scans these notes upon creation to detect Deel buying signals (e.g., remote hiring, series funding, contractor risks).
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-semibold shadow-xs transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? 'Creating & Scoring Account...' : 'Create & Qualify Account'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
