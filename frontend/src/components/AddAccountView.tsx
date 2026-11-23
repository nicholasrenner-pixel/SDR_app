import React, { useState } from 'react';
import { Building2, User, Globe, MapPin, ArrowLeft, Sparkles } from 'lucide-react';
import type { CreateAccountPayload } from '../types';

interface AddAccountViewProps {
  onBack: () => void;
  onSubmit: (payload: CreateAccountPayload) => Promise<void>;
}

export const AddAccountView: React.FC<AddAccountViewProps> = ({ onBack, onSubmit }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateAccountPayload>({
    company_name: '',
    website: '',
    industry: 'Supply Chain & Logistics',
    company_size: '201-1000',
    location: '',
    prospect_name: '',
    prospect_title: '',
    linkedin_url: '',
    research_notes: '',
    status: 'New',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company_name.trim()) return;

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
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Accounts</span>
        </button>
        <span className="text-xs text-slate-400 font-medium">New Target Profile</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Add Target Account</h2>
          <p className="text-xs text-slate-500 mt-1">
            Input target organization details and paste raw research notes (job postings, press releases, website copy).
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              1. Company Details
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
                    placeholder="e.g. Apex Cargo Systems"
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
                    placeholder="e.g. https://apexcargo.io"
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
                  <option value="Enterprise Software / SaaS">Enterprise Software / SaaS</option>
                  <option value="Supply Chain & Logistics">Supply Chain & Logistics</option>
                  <option value="Fintech & Payments">Fintech & Payments</option>
                  <option value="Healthcare & Life Sciences">Healthcare & Life Sciences</option>
                  <option value="Manufacturing & Industrial">Manufacturing & Industrial</option>
                  <option value="E-Commerce & Retail">E-Commerce & Retail</option>
                  <option value="HR Tech & Recruiting">HR Tech & Recruiting</option>
                  <option value="Other B2B">Other B2B</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Company Size (ICP Tier)
                </label>
                <select
                  name="company_size"
                  value={formData.company_size}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                >
                  <option value="201-1000">201–1,000 employees (Sweet Spot: 20 pts)</option>
                  <option value="51-200">51–200 employees (Mid-Market: 16 pts)</option>
                  <option value="1001-5000">1,001–5,000 employees (Enterprise: 14 pts)</option>
                  <option value="5000+">5,000+ employees (Large Enterprise: 14 pts)</option>
                  <option value="11-50">11–50 employees (Early Stage: 8 pts)</option>
                  <option value="1-10">1–10 employees (Micro / Seed: 4 pts)</option>
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
                    name="location"
                    placeholder="e.g. Austin, TX (or Remote / EMEA)"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              2. Target Prospect Persona
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Prospect Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="prospect_name"
                    placeholder="e.g. Jordan Miller"
                    value={formData.prospect_name}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Prospect Title
                </label>
                <input
                  type="text"
                  name="prospect_title"
                  placeholder="e.g. VP of Sales Development"
                  value={formData.prospect_title}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  LinkedIn URL (Optional)
                </label>
                <input
                  type="text"
                  name="linkedin_url"
                  placeholder="https://linkedin.com/in/prospect"
                  value={formData.linkedin_url}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                3. Pasted Research Notes (Strict Grounding Source)
              </h3>
              <span className="text-[11px] text-blue-600 font-medium">
                Zero hallucination: Only facts pasted here will be used
              </span>
            </div>

            <div>
              <textarea
                name="research_notes"
                rows={7}
                placeholder="Paste job postings, careers page text, funding announcements, LinkedIn executive quotes, current tech stack mentions, or compliance challenges..."
                value={formData.research_notes}
                onChange={handleChange}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 leading-relaxed"
              />
              <p className="text-[11px] text-slate-500 mt-1.5">
                Tip: Include specific metrics (e.g. headcount growth, funding rounds, tools used) for hyper-personalized outreach briefs.
              </p>
            </div>
          </div>

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
              className="inline-flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? 'Creating Account...' : 'Create & Score Account'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
