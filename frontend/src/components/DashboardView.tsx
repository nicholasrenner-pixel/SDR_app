import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, CartesianGrid
} from 'recharts';
import { 
  Building2, 
  Flame, 
  Send, 
  CheckCircle2, 
  CalendarClock, 
  ArrowRight,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import type { DashboardAnalytics, Account } from '../types';

interface DashboardViewProps {
  analytics: DashboardAnalytics | null;
  accounts: Account[];
  onSelectAccount: (id: number) => void;
  onNavigate: (view: 'accounts' | 'add-account') => void;
  onFilterDueToday: () => void;
}

const TEMP_COLORS: Record<string, string> = {
  HOT: '#e11d48',          // Rose 600
  WARM: '#d97706',         // Amber 600
  COLD: '#64748b',         // Slate 500
  DISQUALIFIED: '#475569', // Dark Slate
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  analytics,
  accounts,
  onSelectAccount,
  onNavigate,
  onFilterDueToday,
}) => {
  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500 text-sm font-medium">Loading Deel pipeline analytics...</div>
      </div>
    );
  }

  const statusData = [
    { name: 'New', count: analytics.status_counts['New'] || 0, fill: '#3b82f6' },
    { name: 'Ready', count: analytics.status_counts['Ready'] || 0, fill: '#6366f1' },
    { name: 'Contacted', count: analytics.status_counts['Contacted'] || 0, fill: '#8b5cf6' },
    { name: 'Replied', count: analytics.status_counts['Replied'] || 0, fill: '#059669' },
    { name: 'Meeting', count: analytics.status_counts['Meeting'] || 0, fill: '#10b981' },
  ];

  const temperatureData = [
    { name: 'HOT (75+)', value: analytics.temperature_counts['HOT'] || 0, color: TEMP_COLORS.HOT },
    { name: 'WARM (45-74)', value: analytics.temperature_counts['WARM'] || 0, color: TEMP_COLORS.WARM },
    { name: 'COLD (<45)', value: analytics.temperature_counts['COLD'] || 0, color: TEMP_COLORS.COLD },
    { name: 'DISQUALIFIED', value: analytics.temperature_counts['DISQUALIFIED'] || 0, color: TEMP_COLORS.DISQUALIFIED },
  ].filter(d => d.value > 0);

  const total = analytics.funnel_counts['Total Accounts'] || 0;
  const ready = analytics.funnel_counts['Ready'] || 0;
  const contacted = analytics.funnel_counts['Contacted'] || 0;
  const replied = analytics.funnel_counts['Replied'] || 0;
  const meeting = analytics.funnel_counts['Meeting'] || 0;

  const funnelData = [
    { stage: '1. Total Accounts', count: total, rate: total > 0 ? '100%' : '0%' },
    { stage: '2. Ready for Outreach', count: ready, rate: total > 0 ? `${Math.round((ready / total) * 100)}%` : '0%' },
    { stage: '3. Contacted', count: contacted, rate: ready > 0 ? `${Math.round((contacted / ready) * 100)}%` : '0%' },
    { stage: '4. Replied', count: replied, rate: contacted > 0 ? `${Math.round((replied / contacted) * 100)}%` : '0%' },
    { stage: '5. Meeting Booked', count: meeting, rate: replied > 0 ? `${Math.round((meeting / replied) * 100)}%` : '0%' },
  ];

  const hotAccounts = accounts.filter(a => a.temperature === 'HOT').slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Welcome & KPI Metrics */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Deel Executive Dashboard</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Global workforce pipeline analytics, Deel ICP scoring velocity, and conversion funnel metrics.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate('add-account')}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-xs transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>Add Target Account</span>
          </button>
        </div>
      </div>

      {/* Top KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Accounts */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Pipeline</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black tabular-nums text-slate-900">{analytics.total_accounts}</span>
            <span className="text-xs font-medium text-slate-500">Target Accounts</span>
          </div>
        </div>

        {/* Hot Accounts (75+) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-600">Hot Priority</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black tabular-nums text-slate-900">{analytics.hot_count}</span>
            <span className="text-xs font-semibold text-rose-600">Score 75+ (High Fit)</span>
          </div>
        </div>

        {/* Meetings Booked */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Meetings Booked</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black tabular-nums text-slate-900">{analytics.meetings_count}</span>
            <span className="text-xs font-semibold text-emerald-600">AE Discovery Set</span>
          </div>
        </div>

        {/* Follow-Ups Due Today */}
        <div 
          onClick={onFilterDueToday}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs cursor-pointer hover:border-blue-300 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">Follow-Ups Due</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <CalendarClock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black tabular-nums text-slate-900">{analytics.due_today_count}</span>
            <span className="text-xs font-semibold text-blue-600 underline">Due Today / Past Due</span>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid: (a) Accounts by Status, (b) Accounts by Temperature, (c) Pipeline Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart A: Accounts by Status */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Accounts by Status</h3>
              <span className="text-xs text-slate-400 font-medium">SDR Pipeline Stage</span>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-500 text-center font-medium">
            Active distribution across SDR lifecycle stages
          </div>
        </div>

        {/* Chart B: Accounts by Temperature */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900">Deel ICP Fit Temperature</h3>
              <span className="text-xs text-slate-400 font-medium">Scoring Tier</span>
            </div>
            <div className="h-56 flex items-center justify-center">
              {temperatureData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={temperatureData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {temperatureData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-xs text-slate-400">No account data available</div>
              )}
            </div>
          </div>
          <div className="flex justify-center flex-wrap gap-x-3 gap-y-1 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
              <span className="text-slate-600 font-medium">HOT ({analytics.hot_count})</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
              <span className="text-slate-600 font-medium">WARM ({analytics.warm_count})</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
              <span className="text-slate-600 font-medium">COLD ({analytics.cold_count})</span>
            </div>
            {analytics.disqualified_count > 0 && (
              <div className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
                <span className="text-slate-600 font-medium">DISQ ({analytics.disqualified_count})</span>
              </div>
            )}
          </div>
        </div>

        {/* Chart C: Pipeline Funnel Conversion */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Pipeline Funnel Conversion</h3>
              <span className="text-xs text-slate-400 font-medium">Stage-by-Stage</span>
            </div>
            <div className="space-y-3">
              {funnelData.map((step, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700">{step.stage}</span>
                    <span className="text-slate-900 tabular-nums">{step.count} ({step.rate})</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        idx === 0 ? 'bg-slate-400' :
                        idx === 1 ? 'bg-blue-600' :
                        idx === 2 ? 'bg-indigo-600' :
                        idx === 3 ? 'bg-amber-600' : 'bg-emerald-600'
                      }`}
                      style={{ width: `${total > 0 ? Math.max((step.count / total) * 100, 3) : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Overall Funnel Yield</span>
            <span className="font-bold text-slate-900 tabular-nums">
              {total > 0 ? `${Math.round((meeting / total) * 100)}%` : '0%'} to Meeting
            </span>
          </div>
        </div>
      </div>

      {/* Hot Accounts Action Panel */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Priority Outbound Targets (Deel ICP 75+)</h3>
            <p className="text-xs text-slate-500">High-intent accounts with active international hiring or contractor misclassification risks.</p>
          </div>
          <button
            onClick={() => onNavigate('accounts')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
          >
            <span>View All Accounts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {hotAccounts.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No HOT prospects scored yet. Toggle signals on your target accounts to increase their score.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {hotAccounts.map((account) => {
              const primaryContact = account.contacts && account.contacts[0];
              return (
                <div
                  key={account.id}
                  onClick={() => onSelectAccount(account.id)}
                  className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 font-bold text-xs tabular-nums">
                      {account.lead_score}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold text-slate-900">{account.company_name}</span>
                        {account.is_sample === 1 && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-600 border border-slate-200">
                            SAMPLE
                          </span>
                        )}
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-50 text-blue-700 border border-blue-200">
                          {account.recommended_product}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {primaryContact ? `${primaryContact.full_name} (${primaryContact.title})` : 'No contact assigned'} • {account.industry || 'B2B'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                      HOT
                    </span>
                    <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                      {account.status}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
