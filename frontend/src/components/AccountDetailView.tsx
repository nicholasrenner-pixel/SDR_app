import React, { useState, useEffect } from 'react';
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
  Eye,
  PhoneCall,
  PhoneOff,
  UserCheck,
  UserX,
  CalendarCheck,
  UserPlus,
  Trash2,
  Share2,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import type { Account, Contact, BriefData } from '../types';
import { 
  getExportBriefUrl, 
  fetchBrief, 
  fetchAEHandoff, 
  addContact, 
  updateContactStatus, 
  deleteContact, 
  logCallOutcome 
} from '../api/client';
import { ScoreBreakdownModal } from './ScoreBreakdownModal';

interface AccountDetailViewProps {
  account: Account;
  onBack: () => void;
  onToggleSignal: (signalKey: string) => void;
  onToggleRedFlag: (flagKey: string) => void;
  onUpdateStatus: (status: string) => void;
  onUpdateCadence: (step: number, followUpDate?: string) => void;
  onUpdateQualification: (field: string, val: string) => Promise<void>;
  onRefreshAccount: () => Promise<void>;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

const POSITIVE_SIGNALS_CONFIG = [
  { key: 'remote_global_hiring', name: "Hiring remote / 'anywhere' roles outside HQ country", points: 25, wedge: 'Deel EOR', desc: 'Recruiting talent across foreign borders without established local entities.' },
  { key: 'recent_funding', name: 'Recent funding round / rapid international GTM expansion', points: 20, wedge: 'Deel EOR & Contractor', desc: 'Fresh venture or private capital earmarked to accelerate international headcount.' },
  { key: 'contractor_misclassification', name: 'Heavy international contractor headcount / misclassification risk', points: 20, wedge: 'Deel Contractor & Shield', desc: 'Foreign contractors acting as full-time staff, exposing firm to statutory fines.' },
  { key: 'fragmented_payroll', name: 'Operating 3+ fragmented local payroll providers across entities', points: 20, wedge: 'Deel Global Payroll', desc: 'Disjointed multi-country payroll causing reporting delays and tax friction.' },
  { key: 'first_global_hr_hire', name: 'Hiring first People Ops / Global Mobility / International Payroll role', points: 15, wedge: 'Deel HR & Immigration', desc: 'First strategic HR hire tasked with designing a compliant distributed workforce strategy.' },
  { key: 'cross_border_ma_visa', name: 'Cross-border M&A or employee visa relocation needs', points: 15, wedge: 'Deel Immigration & EOR', desc: 'Acquisition integration or talent transfers requiring work visas and rapid legal employer sponsor.' },
];

const RED_FLAGS_CONFIG = [
  { key: 'domestic_only', name: 'Strict domestic / on-site-only hiring policy', points: -30, desc: 'Executive mandate forbidding international or remote hiring.' },
  { key: 'hiring_freeze', name: 'Active company-wide hiring freeze or layoffs', points: -25, desc: 'Recruitment paused; expansion budgets frozen across all departments.' },
  { key: 'legacy_lock_in', name: 'Legacy 5,000+ enterprise locked into multi-year Workday/ADP contracts', points: -20, desc: 'High procurement friction and multi-year vendor commitments preventing category switch.' },
];

const CADENCE_STEPS = [
  { step: 1, label: 'Day 1: Email + LI Connect', channel: 'Email / LI' },
  { step: 2, label: 'Day 3: Cold Call 1', channel: 'Phone' },
  { step: 3, label: 'Day 4: Value Bump Email', channel: 'Email' },
  { step: 4, label: 'Day 6: Second Call + Voicemail', channel: 'Phone' },
  { step: 5, label: 'Day 7: Breakup Note', channel: 'Email' },
];

export const AccountDetailView: React.FC<AccountDetailViewProps> = ({
  account,
  onBack,
  onToggleSignal,
  onToggleRedFlag,
  onUpdateStatus,
  onUpdateCadence,
  onUpdateQualification,
  onRefreshAccount,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'signals' | 'brief' | 'handoff'>('signals');
  const [coldCallMode, setColdCallMode] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<number | null>(
    account.contacts && account.contacts.length > 0 ? account.contacts[0].id : null
  );

  const [brief, setBrief] = useState<BriefData | null>(null);
  const [loadingBrief, setLoadingBrief] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Qualification form fields
  const [pain, setPain] = useState(account.qualification_pain || '');
  const [vendor, setVendor] = useState(account.qualification_current_vendor || '');
  const [timeline, setTimeline] = useState(account.qualification_timeline || '');
  const [qualNotes, setQualNotes] = useState(account.qualification_notes || '');
  const [savingQual, setSavingQual] = useState(false);

  // Cold Call Mode live state
  const [liveCallNotes, setLiveCallNotes] = useState('');
  const [expandedObjection, setExpandedObjection] = useState<number | null>(null);

  // Add contact modal
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactTitle, setNewContactTitle] = useState('');
  const [newContactPersona, setNewContactPersona] = useState('VP of People / Talent');
  const [newContactRole, setNewContactRole] = useState('Champion');
  const [newContactLinkedIn, setNewContactLinkedIn] = useState('');

  // Follow-up due date
  const [dueDate, setDueDate] = useState(account.follow_up_due || '');

  // Fetch brief when account or active contact changes
  useEffect(() => {
    let isMounted = true;
    async function loadBrief() {
      setLoadingBrief(true);
      try {
        const data = await fetchBrief(account.id, selectedContactId || undefined);
        if (isMounted) setBrief(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoadingBrief(false);
      }
    }
    loadBrief();
    return () => { isMounted = false; };
  }, [account.id, selectedContactId, account.buying_signals, account.red_flags]);

  const activeContact = account.contacts?.find(c => c.id === selectedContactId) || (account.contacts && account.contacts[0]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    onShowToast('Copied to clipboard!');
  };

  const handleSaveQualification = async () => {
    setSavingQual(true);
    try {
      await onUpdateQualification('qualification_pain', pain);
      await onUpdateQualification('qualification_current_vendor', vendor);
      await onUpdateQualification('qualification_timeline', timeline);
      await onUpdateQualification('qualification_notes', qualNotes);
      onShowToast('Qualification details saved');
    } finally {
      setSavingQual(false);
    }
  };

  const handleCopyAEHandoff = async () => {
    try {
      const text = await fetchAEHandoff(account.id);
      navigator.clipboard.writeText(text);
      handleCopy(text, 'handoff-packet');
    } catch (err) {
      onShowToast('Could not generate handoff packet', 'error');
    }
  };

  const handleAddContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim()) return;

    try {
      const created = await addContact(account.id, {
        full_name: newContactName.trim(),
        title: newContactTitle.trim() || 'Stakeholder',
        persona: newContactPersona,
        buying_role: newContactRole,
        linkedin_url: newContactLinkedIn.trim() || undefined,
        outreach_status: 'Not Contacted'
      });
      await onRefreshAccount();
      setSelectedContactId(created.id);
      setShowAddContact(false);
      setNewContactName('');
      setNewContactTitle('');
      onShowToast(`Added stakeholder ${created.full_name}`);
    } catch (err) {
      onShowToast('Failed to add contact', 'error');
    }
  };

  const handleContactStatusChange = async (contactId: number, status: string) => {
    try {
      await updateContactStatus(account.id, contactId, status);
      await onRefreshAccount();
      onShowToast(`Updated contact status to ${status}`);
    } catch (err) {
      onShowToast('Failed to update contact', 'error');
    }
  };

  const handleDeleteContact = async (contactId: number) => {
    if (!window.confirm('Delete this stakeholder?')) return;
    try {
      await deleteContact(account.id, contactId);
      await onRefreshAccount();
      if (selectedContactId === contactId) {
        setSelectedContactId(null);
      }
      onShowToast('Contact removed');
    } catch (err) {
      onShowToast('Failed to delete contact', 'error');
    }
  };

  const handleCallOutcome = async (outcome: 'No Answer' | 'Gatekeeper' | 'Pitched - Not Interested' | 'Follow-Up Requested' | 'Meeting Booked') => {
    try {
      await logCallOutcome(account.id, {
        contact_name: activeContact ? activeContact.full_name : 'Prospect',
        outcome,
        notes: liveCallNotes.trim() || undefined
      });
      setLiveCallNotes('');
      await onRefreshAccount();
      onShowToast(`Call logged: ${outcome}`);
    } catch (err) {
      onShowToast('Failed to log call outcome', 'error');
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
    if (account.temperature === 'DISQUALIFIED') {
      return (
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-200 border border-slate-700">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          <span>DISQUALIFIED</span>
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

  return (
    <div className="space-y-6">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Target Accounts</span>
        </button>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setColdCallMode(!coldCallMode)}
            className={`inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              coldCallMode 
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs' 
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
            }`}
          >
            {coldCallMode ? <PhoneOff className="w-4 h-4" /> : <PhoneCall className="w-4 h-4" />}
            <span>{coldCallMode ? 'Exit Cold Call Mode' : 'Enter Cold Call Mode'}</span>
          </button>

          <div className="flex items-center space-x-1.5 bg-white px-3 py-1 rounded-lg border border-slate-200 text-xs font-semibold">
            <span className="text-slate-500">Status:</span>
            <select
              value={account.status}
              onChange={(e) => onUpdateStatus(e.target.value)}
              className="font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="New">New</option>
              <option value="Ready">Ready</option>
              <option value="Contacted">Contacted</option>
              <option value="Replied">Replied</option>
              <option value="Meeting">Meeting</option>
            </select>
          </div>
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
              {account.is_sample === 1 && (
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
              <span className="font-semibold text-slate-700">{account.industry || 'B2B'}</span>
              <span>•</span>
              <span>{account.company_size} employees</span>
              <span>•</span>
              <span>{account.hq_location || 'HQ Unspecified'}</span>
            </div>

            {/* Recommended Deel Product Banner */}
            <div className="pt-2 flex items-center space-x-2 text-xs">
              <span className="font-semibold text-slate-600">Recommended Wedge:</span>
              <span className="px-2.5 py-0.5 rounded-md font-bold text-xs bg-blue-50 text-blue-700 border border-blue-200">
                {account.recommended_product}
              </span>
            </div>
          </div>

          {/* Lead Score & Temperature Card */}
          <div className="flex items-center space-x-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Deel ICP Score
              </span>
              <div className="flex items-baseline space-x-1">
                <span className={`text-4xl font-black tabular-nums ${
                  account.lead_score >= 75 ? 'text-rose-600' :
                  account.lead_score >= 45 ? 'text-amber-600' : 
                  account.temperature === 'DISQUALIFIED' ? 'text-slate-700' : 'text-slate-600'
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
                  <span>View Scoring Rationale</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 5-Step SDR Cadence Tracker */}
        <div className="mt-6 pt-5 border-t border-slate-200 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              5-Step Multi-Channel Cadence
            </span>
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-500 font-semibold">Follow-Up Due:</span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  onUpdateCadence(account.cadence_step, e.target.value);
                }}
                className="py-1 px-2 border border-slate-200 rounded text-xs font-medium text-slate-800 bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1">
            {CADENCE_STEPS.map((s) => {
              const isPast = account.cadence_step > s.step;
              const isCurrent = account.cadence_step === s.step;
              return (
                <button
                  key={s.step}
                  onClick={() => onUpdateCadence(s.step, dueDate)}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                    isCurrent
                      ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                      : isPast
                      ? 'bg-blue-50 text-blue-800 border-blue-200 font-medium'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-[10px] opacity-80 uppercase tracking-wider">Step {s.step}</div>
                  <div className="truncate font-semibold">{s.label}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* View Tabs */}
        {!coldCallMode && (
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
              <span>Deel Buying Signals & Red Flags</span>
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
              <span>Grounded Outreach Brief</span>
              {brief && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
            </button>

            <button
              onClick={() => setActiveTab('handoff')}
              className={`pb-2 border-b-2 transition-colors flex items-center space-x-2 ${
                activeTab === 'handoff'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Share2 className="w-4 h-4" />
              <span>Qualification & AE Handoff</span>
            </button>
          </div>
        )}
      </div>

      {/* Multi-Threading Contacts Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <span>Multi-Threaded Stakeholder Map</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {account.contacts?.length || 0} Contacts
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select a stakeholder to dynamically generate their tailored outreach angle and cold call talk track.
            </p>
          </div>

          <button
            onClick={() => setShowAddContact(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold transition-colors w-fit"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Stakeholder</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3">
          {account.contacts && account.contacts.map((contact) => {
            const isSelected = selectedContactId === contact.id;
            return (
              <div
                key={contact.id}
                onClick={() => setSelectedContactId(contact.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-50/80 border-blue-500 ring-1 ring-blue-500 shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-sm text-slate-900">{contact.full_name}</div>
                      <div className="text-xs text-slate-600 font-medium">{contact.title}</div>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-600 text-white">
                        Active
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {contact.persona}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {contact.buying_role}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <select
                    value={contact.outreach_status}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleContactStatusChange(contact.id, e.target.value)}
                    className="text-[11px] font-semibold py-0.5 px-2 rounded border border-slate-200 bg-white text-slate-700"
                  >
                    <option value="Not Contacted">Not Contacted</option>
                    <option value="Email Sent">Email Sent</option>
                    <option value="Called">Called</option>
                    <option value="Replied">Replied</option>
                    <option value="Meeting Booked">Meeting Booked</option>
                  </select>

                  <div className="flex items-center space-x-2">
                    {contact.linkedin_url && (
                      <a
                        href={contact.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-blue-600 hover:text-blue-800 text-[11px] font-semibold"
                      >
                        LinkedIn
                      </a>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteContact(contact.id);
                      }}
                      className="text-slate-400 hover:text-rose-600 p-0.5"
                      title="Delete contact"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* COLD CALL SPLIT-SCREEN MODE */}
      {coldCallMode && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-slate-900 p-6 rounded-xl text-white shadow-xl">
          {/* Left Pane: Talk Track & Objection Rebuttals */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Target: {activeContact?.full_name} ({activeContact?.title})
                </span>
                <h3 className="text-base font-bold text-white">Live Cold Call Talk Track</h3>
              </div>
              <button
                onClick={() => handleCopy(brief?.talk_track || '', 'live-talk-track')}
                className="text-xs font-semibold px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors flex items-center space-x-1"
              >
                {copiedKey === 'live-talk-track' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy Script</span>
              </button>
            </div>

            {/* 30-Second Talk Track */}
            <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-lg text-sm leading-relaxed font-mono text-slate-200">
              {brief?.talk_track || 'Not in notes'}
            </div>

            {/* Top 3 Discovery Questions */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Top Discovery Questions
              </h4>
              <div className="space-y-2">
                {brief?.discovery_questions.slice(0, 3).map((q, idx) => (
                  <div key={idx} className="p-3 bg-slate-800/60 border border-slate-700/80 rounded-lg text-xs text-slate-300">
                    <span className="font-bold text-blue-400 mr-1.5">Q{idx + 1}:</span>
                    {q}
                  </div>
                ))}
              </div>
            </div>

            {/* Collapsible Objection Battlecards */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Quick Objection Battlecards
              </h4>
              <div className="space-y-1.5">
                {brief?.objections.map((o, idx) => {
                  const isExpanded = expandedObjection === idx;
                  return (
                    <div key={idx} className="border border-slate-700 rounded-lg overflow-hidden bg-slate-800/50">
                      <button
                        onClick={() => setExpandedObjection(isExpanded ? null : idx)}
                        className="w-full p-2.5 text-left text-xs font-bold text-slate-200 flex items-center justify-between hover:bg-slate-750"
                      >
                        <span className="truncate pr-2">"{o.objection}"</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                      </button>
                      {isExpanded && (
                        <div className="p-3 text-xs text-slate-300 bg-slate-850 border-t border-slate-700 leading-relaxed">
                          <strong className="text-emerald-400">Deel Rebuttal: </strong>
                          {o.response}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Pane: Live Notes & 1-Click Call Outcome Logger */}
          <div className="space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white">Live Call Outcome Logger</h3>
                <span className="text-xs text-slate-400 font-medium">Auto-persists to CRM</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Live Notes / Objection Heard / Follow-Up Context
                </label>
                <textarea
                  rows={8}
                  placeholder="Type notes during call (e.g., Gatekeeper said Elena is out until Thursday; requested 2 EOR comparison sheets)..."
                  value={liveCallNotes}
                  onChange={(e) => setLiveCallNotes(e.target.value)}
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed font-mono"
                />
              </div>

              {/* One-Click Call Outcome Buttons */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400">
                  Select Call Outcome to Save:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleCallOutcome('No Answer')}
                    className="p-2.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors"
                  >
                    No Answer
                  </button>
                  <button
                    onClick={() => handleCallOutcome('Gatekeeper')}
                    className="p-2.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors"
                  >
                    Gatekeeper Block
                  </button>
                  <button
                    onClick={() => handleCallOutcome('Pitched - Not Interested')}
                    className="p-2.5 rounded-lg text-xs font-bold bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-200 transition-colors"
                  >
                    Pitched - Not Interested
                  </button>
                  <button
                    onClick={() => handleCallOutcome('Follow-Up Requested')}
                    className="p-2.5 rounded-lg text-xs font-bold bg-blue-900/60 hover:bg-blue-800 border border-blue-700 text-blue-200 transition-colors"
                  >
                    Follow-Up Requested
                  </button>
                </div>

                <button
                  onClick={() => handleCallOutcome('Meeting Booked')}
                  className="w-full mt-2 p-3 rounded-lg text-sm font-black bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center justify-center space-x-2 shadow-lg"
                >
                  <CalendarCheck className="w-5 h-5" />
                  <span>Meeting Booked! (Advance to Meeting)</span>
                </button>
              </div>
            </div>

            {/* Historical Call Logs */}
            {account.call_logs && account.call_logs.length > 0 && (
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Recent Call Activity
                </span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {account.call_logs.map((log) => (
                    <div key={log.id} className="p-2 bg-slate-800/40 rounded border border-slate-700/60 text-[11px]">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="font-bold">{log.outcome}</span>
                        <span className="text-slate-500">{log.logged_at.slice(0, 16).replace('T', ' ')}</span>
                      </div>
                      {log.notes && <p className="text-slate-400 mt-0.5">{log.notes}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 1: BUYING SIGNALS & RED FLAGS */}
      {!coldCallMode && activeTab === 'signals' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Signals Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Positive Buying Signals */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Positive Deel Buying Signals
                  </h3>
                  <p className="text-xs text-slate-500">
                    Checked signals add points and route to the primary Deel product wedge.
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-600">+15 to +25 pts</span>
              </div>

              <div className="space-y-2.5">
                {POSITIVE_SIGNALS_CONFIG.map((signal) => {
                  const isActive = account.buying_signals?.includes(signal.key);
                  return (
                    <div
                      key={signal.key}
                      onClick={() => onToggleSignal(signal.key)}
                      className={`p-3.5 rounded-lg border cursor-pointer transition-all flex items-start justify-between select-none ${
                        isActive
                          ? 'bg-blue-50/60 border-blue-200 shadow-2xs'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
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
                            <span className={`text-sm font-bold ${isActive ? 'text-blue-950' : 'text-slate-800'}`}>
                              {signal.name}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
                              +{signal.points} pts
                            </span>
                            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                              Wedge: {signal.wedge}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{signal.desc}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-xs font-bold ${isActive ? 'text-blue-700' : 'text-slate-400'}`}>
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Red Flags / Disqualification Check */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>Disqualification Red Flags</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Deducts points and marks account as DISQUALIFIED if raw score drops below 25.
                  </p>
                </div>
                <span className="text-xs font-bold text-rose-600">-20 to -30 pts</span>
              </div>

              <div className="space-y-2.5">
                {RED_FLAGS_CONFIG.map((flag) => {
                  const isActive = account.red_flags?.includes(flag.key);
                  return (
                    <div
                      key={flag.key}
                      onClick={() => onToggleRedFlag(flag.key)}
                      className={`p-3.5 rounded-lg border cursor-pointer transition-all flex items-start justify-between select-none ${
                        isActive
                          ? 'bg-rose-50/60 border-rose-300 shadow-2xs'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start space-x-3 pr-4">
                        <div className="mt-0.5">
                          {isActive ? (
                            <CheckSquare className="w-5 h-5 text-rose-600 shrink-0" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-300 hover:text-slate-400 shrink-0" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className={`text-sm font-bold ${isActive ? 'text-rose-950' : 'text-slate-800'}`}>
                              {flag.name}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800">
                              {flag.points} pts
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{flag.desc}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-xs font-bold ${isActive ? 'text-rose-700' : 'text-slate-400'}`}>
                          {isActive ? 'Flagged' : 'Clear'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Research Notes Reference Panel */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Research Notes Reference</h3>
                <p className="text-xs text-slate-500">Sole source text for grounding outreach</p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 leading-relaxed max-h-[460px] overflow-y-auto">
                {account.research_notes}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex items-center space-x-1.5 text-xs text-slate-600">
                <ShieldAlert className="w-4 h-4 text-blue-600" />
                <span className="font-bold">Zero-Hallucination Rule</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                If facts do not appear in the research notes, the brief generator explicitly outputs "Not in notes" rather than fabricating numbers.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GROUNDED OUTREACH BRIEF */}
      {!coldCallMode && activeTab === 'brief' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                Active Stakeholder: {activeContact?.full_name || 'Prospect'} ({activeContact?.persona || 'Persona'})
              </span>
              <h3 className="text-sm font-bold text-slate-900">Grounded Outreach Dossier</h3>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  if (brief) {
                    const fullText = `DEEL OUTREACH BRIEF: ${account.company_name}\nTarget: ${brief.contact_name} (${brief.contact_title})\nPersona: ${brief.persona}\nWedge: ${brief.recommended_product}\n\n1. Company Summary:\n${brief.company_summary}\n\n2. Best Outreach Angle:\n${brief.best_outreach_angle}\n\n3. Personalized First Lines:\n${brief.personalized_first_lines.map((l, i) => `${i+1}. ${l}`).join('\n')}\n\n4. Discovery Questions:\n${brief.discovery_questions.map((q, i) => `${i+1}. ${q}`).join('\n')}\n\n5. Objections:\n${brief.objections.map(o => `Q: ${o.objection}\nA: ${o.response}`).join('\n\n')}\n\n6. Talk Track:\n${brief.talk_track}\n\n7. Next Step:\n${brief.next_step}`;
                    handleCopy(fullText, 'full-brief');
                  }
                }}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
              >
                {copiedKey === 'full-brief' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'full-brief' ? 'Copied Full Brief!' : 'Copy Full Brief'}</span>
              </button>

              <a
                href={getExportBriefUrl(account.id, selectedContactId || undefined)}
                download={`${account.company_name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-brief.md`}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Brief (.md)</span>
              </a>
            </div>
          </div>

          {loadingBrief || !brief ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 text-xs">
              Generating grounded brief...
            </div>
          ) : (
            <div className="space-y-4">
              {/* 1. Company Summary */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    1. Company Summary (Notes Grounded)
                  </h4>
                  <button
                    onClick={() => handleCopy(brief.company_summary, 'summary')}
                    className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
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
                    2. Best Outreach Angle (Tailored to {brief.persona})
                  </h4>
                  <button
                    onClick={() => handleCopy(brief.best_outreach_angle, 'angle')}
                    className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
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
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  3. Personalized First Lines (Strictly Quoting & Referencing Notes)
                </h4>
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
                      >
                        {copiedKey === `line-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Discovery Questions */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  4. 5 Deel Discovery Questions
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
                      >
                        {copiedKey === `q-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. Likely Objections & Rebuttals */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  5. 3 Likely Objections & Deel Battlecard Rebuttals
                </h4>
                <div className="space-y-3">
                  {brief.objections.map((item, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-slate-900 text-xs">
                          Objection {idx + 1}: "{item.objection}"
                        </div>
                        <button
                          onClick={() => handleCopy(`Objection: ${item.objection}\nResponse: ${item.response}`, `obj-${idx}`)}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                        >
                          {copiedKey === `obj-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <div className="text-xs text-slate-700 bg-white p-3 rounded border border-slate-200 leading-relaxed">
                        <span className="font-bold text-blue-700">Deel Rebuttal: </span>
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
                    6. 30-Second Cold Call Talk Track
                  </h4>
                  <button
                    onClick={() => handleCopy(brief.talk_track, 'talk-track')}
                    className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                  >
                    {copiedKey === 'talk-track' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 leading-relaxed font-mono text-xs">
                  {brief.talk_track}
                </div>
              </div>

              {/* 7. Next Step */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    7. One Clear Next Step
                  </h4>
                  <button
                    onClick={() => handleCopy(brief.next_step, 'next-step')}
                    className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
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

      {/* TAB 3: QUALIFICATION & AE HANDOFF */}
      {!coldCallMode && activeTab === 'handoff' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">SDR Qualification & AE Handoff</h3>
              <p className="text-xs text-slate-500">
                Structure pain, current vendor, and timeline for seamless Account Executive pipeline handoff.
              </p>
            </div>
            <button
              onClick={handleCopyAEHandoff}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Copy AE Handoff Packet</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Identified Core Global Workforce Pain
                </label>
                <textarea
                  rows={3}
                  value={pain}
                  onChange={(e) => setPain(e.target.value)}
                  placeholder="e.g. 25+ contractors in Poland & Brazil facing misclassification risks; hiring 12 engineers without entities..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Current Vendor / Process
                </label>
                <textarea
                  rows={3}
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  placeholder="e.g. Wise international wires + domestic Gusto for US team; manual spreadsheets..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Expansion Timeline
                </label>
                <input
                  type="text"
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value)}
                  placeholder="e.g. Q1/Q2 ramp; onboard 12 foreign hires within 45 days"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Live SDR Qualification Notes
                </label>
                <input
                  type="text"
                  value={qualNotes}
                  onChange={(e) => setQualNotes(e.target.value)}
                  placeholder="e.g. Elena Rostova is Champion; Marcus Vance holds budget approval..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={handleSaveQualification}
                disabled={savingQual}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
              >
                {savingQual ? 'Saving...' : 'Save Qualification Notes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Stakeholder Modal */}
      {showAddContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Multi-Threaded Stakeholder</h3>
              <button onClick={() => setShowAddContact(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddContactSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marcus Vance"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chief Financial Officer"
                  value={newContactTitle}
                  onChange={(e) => setNewContactTitle(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Deel Persona</label>
                <select
                  value={newContactPersona}
                  onChange={(e) => setNewContactPersona(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 font-medium"
                >
                  <option value="VP of People / Talent">VP of People / Talent (Champion)</option>
                  <option value="CFO / Finance">CFO / Finance (Economic Buyer)</option>
                  <option value="General Counsel / Payroll">General Counsel / Payroll (Evaluator)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Buying Role</label>
                <select
                  value={newContactRole}
                  onChange={(e) => setNewContactRole(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 font-medium"
                >
                  <option value="Champion">Champion</option>
                  <option value="Economic Buyer">Economic Buyer</option>
                  <option value="Legal / Technical Evaluator">Legal / Technical Evaluator</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">LinkedIn URL</label>
                <input
                  type="text"
                  placeholder="https://linkedin.com/in/prospect"
                  value={newContactLinkedIn}
                  onChange={(e) => setNewContactLinkedIn(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddContact(false)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold"
                >
                  Save Stakeholder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scoring Breakdown Modal */}
      <ScoreBreakdownModal
        isOpen={showBreakdown}
        onClose={() => setShowBreakdown(false)}
        scoreDetails={account.score_details}
        companyName={account.company_name}
      />
    </div>
  );
};
