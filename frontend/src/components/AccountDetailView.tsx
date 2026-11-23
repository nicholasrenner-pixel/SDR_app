import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Sparkles, 
  Download, 
  Copy, 
  Check, 
  ExternalLink, 
  Flame, 
  SunMedium, 
  Snowflake, 
  CheckSquare, 
  Square, 
  FileText, 
  ShieldAlert, 
  ArrowRight,
  Eye
} from 'lucide-react';
import type { Account } from '../types';
import { getExportBriefUrl } from '../api/client';
import { ScoreBreakdownModal } from './ScoreBreakdownModal';

interface AccountDetailViewProps {
  account: Account;
  onBack: () => void;
  onToggleSignal: (signalKey: string) => void;
  onGenerateBrief: () => Promise<void>;
  onUpdateStatus: (status: string) => void;
  onSaveNotes: (notes: string) => Promise<void>;
}

const BUYING_SIGNALS_LIST = [
  { key: 'hiring_sdrs_aes', name: 'Hiring SDRs / AEs', points: 12, desc: 'Active hiring for outbound pipeline builders and quota carriers.' },
  { key: 'hiring_internationally', name: 'Hiring internationally', points: 10, desc: 'Scaling distributed cross-border teams.' },
  { key: 'new_funding', name: 'New funding', points: 12, desc: 'Recent venture or debt capital infusion earmarked for growth.' },
  { key: 'new_leadership', name: 'New leadership', points: 10, desc: 'New VP or C-level hire reviewing legacy tools.' },
  { key: 'using_competitor', name: 'Using a competitor', points: 8, desc: 'Validated budget; ripe for competitive displacement.' },
  { key: 'expanding_countries', name: 'Expanding to new countries', points: 10, desc: 'New regional jurisdictions creating operational friction.' },
  { key: 'payroll_compliance_pain', name: 'Payroll / compliance pain mentioned', points: 10, desc: 'Explicit administrative overhead or regulatory drag in notes.' },
  { key: 'headcount_growing_fast', name: 'Headcount growing fast', points: 8, desc: 'Team scaling >20% YoY, straining current workflows.' },
];

export const AccountDetailView: React.FC<AccountDetailViewProps> = ({
  account,
  onBack,
  onToggleSignal,
  onGenerateBrief,
  onUpdateStatus,
  onSaveNotes,
}) => {
  const [activeTab, setActiveTab] = useState<'signals' | 'brief'>('signals');
  const [generating, setGenerating] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [editableNotes, setEditableNotes] = useState(account.research_notes || '');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesDirty, setNotesDirty] = useState(false);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await onGenerateBrief();
      setActiveTab('brief');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveNotesClick = async () => {
    setSavingNotes(true);
    try {
      await onSaveNotes(editableNotes);
      setNotesDirty(false);
    } finally {
      setSavingNotes(false);
    }
  };

  const renderTempBadge = () => {
    if (account.temperature === 'HOT') {
      return (
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <Flame className="w-3.5 h-3.5 text-rose-600" />
          <span>HOT PROSPECT (Score 75+)</span>
        </span>
      );
    }
    if (account.temperature === 'WARM') {
      return (
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <SunMedium className="w-3.5 h-3.5 text-amber-600" />
          <span>WARM LEAD (Score 45–74)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
        <Snowflake className="w-3.5 h-3.5 text-slate-500" />
        <span>COLD ACCOUNT (Score &lt;45)</span>
      </span>
    );
  };

  const brief = account.brief;

  return (
    <div className="space-y-6">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Accounts</span>
        </button>

        <div className="flex items-center space-x-3">
          <span className="text-xs font-semibold text-slate-500">Pipeline Status:</span>
          <select
            value={account.status}
            onChange={(e) => onUpdateStatus(e.target.value)}
            className="text-xs font-bold py-1.5 px-3 rounded-lg border border-slate-200 bg-white text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="New">New</option>
            <option value="Ready">Ready</option>
            <option value="Contacted">Contacted</option>
            <option value="Replied">Replied</option>
            <option value="Meeting">Meeting</option>
          </select>
        </div>
      </div>

      {/* Main Account Header & Score Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Account Profile Details */}
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {account.company_name}
              </h1>
              {account.is_sample && (
                <span className="px-2 py-0.5 text-xs font-bold rounded bg-slate-100 text-slate-700 border border-slate-300">
                  SAMPLE ACCOUNT
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
              {account.website && (
                <a
                  href={account.website.startsWith('http') ? account.website : `https://${account.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-blue-600 hover:underline font-medium"
                >
                  <span>{account.website.replace(/^https?:\/\//, '')}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              <span>•</span>
              <span className="font-medium text-slate-700">{account.industry || 'B2B'}</span>
              <span>•</span>
              <span>{account.company_size ? `${account.company_size} employees` : 'Size n/a'}</span>
              <span>•</span>
              <span>{account.location || 'Location unspecified'}</span>
            </div>

            {/* Target Prospect Persona */}
            <div className="pt-2 flex items-center space-x-2 text-xs text-slate-700">
              <span className="font-semibold text-slate-900">Prospect Target:</span>
              <span className="font-medium">{account.prospect_name || 'No prospect assigned'}</span>
              {account.prospect_title && <span className="text-slate-500">({account.prospect_title})</span>}
              {account.linkedin_url && (
                <a
                  href={account.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-[11px] font-semibold"
                >
                  LinkedIn Profile
                </a>
              )}
            </div>
          </div>

          {/* Transparent Score Display Card */}
          <div className="flex items-center space-x-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Lead Score
              </span>
              <div className="flex items-baseline space-x-1">
                <span className={`text-4xl font-black ${
                  account.lead_score >= 75 ? 'text-rose-600' :
                  account.lead_score >= 45 ? 'text-amber-600' : 'text-slate-700'
                }`}>
                  {account.lead_score}
                </span>
                <span className="text-sm font-semibold text-slate-400">/ 100</span>
              </div>
            </div>

            <div className="space-y-1.5 border-l border-slate-200 pl-5">
              {renderTempBadge()}
              <div>
                <button
                  onClick={() => setShowBreakdown(true)}
                  className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Point Breakdown</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* View Tabs */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex items-center space-x-6 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('signals')}
            className={`pb-2 border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'signals'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Interactive Buying Signals Checklist</span>
          </button>

          <button
            onClick={() => setActiveTab('brief')}
            className={`pb-2 border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'brief'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Outreach Brief Engine & Export</span>
            {brief && (
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            )}
          </button>
        </div>
      </div>

      {/* Tab 1: Interactive Buying Signals Checklist */}
      {activeTab === 'signals' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 8 Signals Checklist */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Interactive Buying Signals Checklist
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Check or uncheck any signal to dynamically recalculate and persist lead score in real time.
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-400">80 pts total</span>
            </div>

            <div className="space-y-2.5">
              {BUYING_SIGNALS_LIST.map((signal) => {
                const isActive = Boolean(account.signals && account.signals[signal.key]);
                return (
                  <div
                    key={signal.key}
                    onClick={() => onToggleSignal(signal.key)}
                    className={`p-3.5 rounded-lg border cursor-pointer transition-all flex items-start justify-between select-none ${
                      isActive
                        ? 'bg-blue-50/60 border-blue-200 shadow-2xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="flex items-start space-x-3 pr-4">
                      <div className="mt-0.5">
                        {isActive ? (
                          <CheckSquare className="w-5 h-5 text-blue-600 shrink-0" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-300 hover:text-slate-400 shrink-0" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-bold ${
                            isActive ? 'text-blue-950' : 'text-slate-800'
                          }`}>
                            {signal.name}
                          </span>
                          <span className={`text-[11px] font-bold px-1.5 py-0.2 rounded ${
                            isActive ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            +{signal.points} pts
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                          {signal.desc}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-xs font-semibold ${
                        isActive ? 'text-blue-700' : 'text-slate-400'
                      }`}>
                        {isActive ? 'Active' : 'Not detected'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Research Notes Reference Panel */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Research Notes Reference</h3>
                  <p className="text-xs text-slate-500">Source text for signals & brief</p>
                </div>
                {notesDirty && (
                  <button
                    onClick={handleSaveNotesClick}
                    disabled={savingNotes}
                    className="text-xs font-semibold px-2.5 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    {savingNotes ? 'Saving...' : 'Save Notes'}
                  </button>
                )}
              </div>

              <textarea
                rows={14}
                value={editableNotes}
                onChange={(e) => {
                  setEditableNotes(e.target.value);
                  setNotesDirty(true);
                }}
                placeholder="Pasted research notes..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 leading-relaxed"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-semibold text-slate-700">Strict Grounding Enforced</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Notes are parsed deterministically. If a hook or fact is missing from the notes, the generator prints "Not in notes".
              </p>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full mt-2 inline-flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{generating ? 'Analyzing Notes...' : 'Generate Grounded Brief'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Grounded Outreach Brief View */}
      {activeTab === 'brief' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Outreach Brief Generator</h3>
                <p className="text-xs text-slate-500">
                  Strictly grounded in pasted research notes • Zero hallucinations
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{generating ? 'Generating...' : brief ? 'Regenerate Brief' : 'Generate Brief'}</span>
              </button>

              {brief && (
                <a
                  href={getExportBriefUrl(account.id)}
                  download={`${account.company_slug}-brief.md`}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Brief (.md)</span>
                </a>
              )}
            </div>
          </div>

          {!brief ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-800">No Brief Generated Yet</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Click "Generate Brief" above to parse the research notes and produce a grounded, executive outreach dossier.
              </p>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="inline-flex items-center space-x-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate Brief Now</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 text-blue-600" />
                  <span>
                    <strong>Strict Grounding Guarantee:</strong> Every line and objection is parsed directly from your research notes. Any missing data point explicitly states <em>"Not in notes"</em>.
                  </span>
                </div>
                <button
                  onClick={() => {
                    const fullText = `OUTREACH BRIEF: ${account.company_name}\n\n1. Company Summary:\n${brief.company_summary}\n\n2. Best Outreach Angle:\n${brief.best_outreach_angle}\n\n3. Personalized First Lines:\n${brief.personalized_first_lines.map((l, i) => `${i+1}. ${l}`).join('\n')}\n\n4. Discovery Questions:\n${brief.discovery_questions.map((q, i) => `${i+1}. ${q}`).join('\n')}\n\n5. Objections:\n${brief.objections.map(o => `Q: ${o.objection}\nA: ${o.response}`).join('\n\n')}\n\n6. Talk Track:\n${brief.talk_track}\n\n7. Next Step:\n${brief.next_step}`;
                    handleCopy(fullText, 'full-brief');
                  }}
                  className="inline-flex items-center space-x-1 font-semibold text-blue-600 hover:text-blue-800"
                >
                  {copiedKey === 'full-brief' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'full-brief' ? 'Copied Full Brief!' : 'Copy Full Brief'}</span>
                </button>
              </div>

              {/* 1. Company Summary */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    1. Company Summary (3 Sentences)
                  </h4>
                  <button
                    onClick={() => handleCopy(brief.company_summary, 'summary')}
                    className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                    title="Copy Company Summary"
                  >
                    {copiedKey === 'summary' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-sm text-slate-800 leading-relaxed font-medium">
                  {brief.company_summary}
                </p>
              </div>

              {/* 2. Best Outreach Angle */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    2. Best Outreach Angle
                  </h4>
                  <button
                    onClick={() => handleCopy(brief.best_outreach_angle, 'angle')}
                    className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                    title="Copy Outreach Angle"
                  >
                    {copiedKey === 'angle' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm font-semibold text-blue-950">
                  {brief.best_outreach_angle}
                </div>
              </div>

              {/* 3. Personalized First Lines */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    3. Personalized First Lines (Strictly Quoting & Referencing Notes)
                  </h4>
                </div>
                <div className="space-y-2.5">
                  {brief.personalized_first_lines.map((line, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start justify-between gap-3 text-sm"
                    >
                      <div className="flex items-start space-x-2">
                        <span className="font-bold text-xs text-blue-600 shrink-0 mt-0.5">
                          Line {idx + 1}:
                        </span>
                        <p className="text-slate-800 leading-relaxed font-medium">{line}</p>
                      </div>
                      <button
                        onClick={() => handleCopy(line, `line-${idx}`)}
                        className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors shrink-0"
                        title="Copy Line"
                      >
                        {copiedKey === `line-${idx}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Discovery Questions */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  4. 5 Tailored Discovery Questions
                </h4>
                <div className="space-y-2">
                  {brief.discovery_questions.map((q, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start justify-between gap-3 text-sm"
                    >
                      <div className="flex items-start space-x-2">
                        <span className="font-bold text-xs text-indigo-600 shrink-0 mt-0.5">
                          Q{idx + 1}:
                        </span>
                        <p className="text-slate-800 leading-relaxed">{q}</p>
                      </div>
                      <button
                        onClick={() => handleCopy(q, `q-${idx}`)}
                        className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors shrink-0"
                        title="Copy Question"
                      >
                        {copiedKey === `q-${idx}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. Likely Objections & Tailored Responses */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  5. 3 Likely Objections & Tailored Responses
                </h4>
                <div className="space-y-3">
                  {brief.objections.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-slate-900 text-xs">
                          Objection {idx + 1}: "{item.objection}"
                        </div>
                        <button
                          onClick={() => handleCopy(`Objection: ${item.objection}\nResponse: ${item.response}`, `obj-${idx}`)}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                          title="Copy Objection & Response"
                        >
                          {copiedKey === `obj-${idx}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <div className="text-xs text-slate-600 bg-white p-3 rounded border border-slate-200">
                        <span className="font-semibold text-blue-700">Recommended SDR Response: </span>
                        {item.response}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 6. 30-Second Talk Track */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    6. 30-Second SDR Talk Track
                  </h4>
                  <button
                    onClick={() => handleCopy(brief.talk_track, 'talk-track')}
                    className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                    title="Copy Talk Track"
                  >
                    {copiedKey === 'talk-track' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 leading-relaxed font-mono text-xs">
                  {brief.talk_track}
                </div>
              </div>

              {/* 7. Clear Next Step */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    7. One Clear Next Step
                  </h4>
                  <button
                    onClick={() => handleCopy(brief.next_step, 'next-step')}
                    className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                    title="Copy Next Step"
                  >
                    {copiedKey === 'next-step' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm font-semibold text-emerald-900 flex items-center space-x-2">
                  <ArrowRight className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{brief.next_step}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Scoring Breakdown Modal */}
      <ScoreBreakdownModal
        isOpen={showBreakdown}
        onClose={() => setShowBreakdown(false)}
        breakdown={account.score_breakdown || null}
        companyName={account.company_name}
      />
    </div>
  );
};
