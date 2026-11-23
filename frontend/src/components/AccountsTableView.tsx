import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ExternalLink, 
  ArrowUpDown, 
  Trash2, 
  Eye, 
  Flame, 
  SunMedium, 
  Snowflake, 
  ShieldAlert,
  CalendarClock,
  Plus
} from 'lucide-react';
import type { Account } from '../types';

interface AccountsTableViewProps {
  accounts: Account[];
  onSelectAccount: (id: number) => void;
  onUpdateStatus: (id: number, status: string) => void;
  onDeleteAccount: (id: number) => void;
  onNavigateAdd: () => void;
  initialDueToday?: boolean;
}

export const AccountsTableView: React.FC<AccountsTableViewProps> = ({
  accounts,
  onSelectAccount,
  onUpdateStatus,
  onDeleteAccount,
  onNavigateAdd,
  initialDueToday = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [tempFilter, setTempFilter] = useState('All');
  const [dueTodayOnly, setDueTodayOnly] = useState(initialDueToday);
  const [sortBy, setSortBy] = useState<'score' | 'company' | 'due'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const filteredAccounts = useMemo(() => {
    return accounts
      .filter((acc) => {
        const primaryContact = acc.contacts && acc.contacts[0];
        const matchesSearch =
          acc.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (acc.industry && acc.industry.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (primaryContact && (
            primaryContact.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            primaryContact.title.toLowerCase().includes(searchTerm.toLowerCase())
          ));

        const matchesStatus = statusFilter === 'All' || acc.status === statusFilter;
        const matchesTemp = tempFilter === 'All' || acc.temperature === tempFilter;
        const matchesDue = !dueTodayOnly || (acc.follow_up_due && acc.follow_up_due <= todayStr && acc.status !== 'Meeting');

        return matchesSearch && matchesStatus && matchesTemp && matchesDue;
      })
      .sort((a, b) => {
        if (sortBy === 'score') {
          return sortOrder === 'desc' ? b.lead_score - a.lead_score : a.lead_score - b.lead_score;
        }
        if (sortBy === 'company') {
          return sortOrder === 'desc' 
            ? b.company_name.localeCompare(a.company_name)
            : a.company_name.localeCompare(b.company_name);
        }
        const aDue = a.follow_up_due || '9999-99-99';
        const bDue = b.follow_up_due || '9999-99-99';
        return sortOrder === 'desc' ? bDue.localeCompare(aDue) : aDue.localeCompare(bDue);
      });
  }, [accounts, searchTerm, statusFilter, tempFilter, dueTodayOnly, sortBy, sortOrder, todayStr]);

  const toggleSort = (field: 'score' | 'company' | 'due') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const renderTempBadge = (temp: string) => {
    if (temp === 'HOT') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <Flame className="w-3 h-3 text-rose-600" />
          <span>HOT</span>
        </span>
      );
    }
    if (temp === 'WARM') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <SunMedium className="w-3 h-3 text-amber-600" />
          <span>WARM</span>
        </span>
      );
    }
    if (temp === 'DISQUALIFIED') {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-200 border border-slate-700">
          <ShieldAlert className="w-3 h-3 text-rose-400" />
          <span>DISQ</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
        <Snowflake className="w-3 h-3 text-slate-500" />
        <span>COLD</span>
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Title & Add Account CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Deel Target Accounts</h2>
          <p className="text-sm text-slate-500">
            Search, qualify, multi-thread, and prioritize target global workforce opportunities.
          </p>
        </div>
        <button
          onClick={onNavigateAdd}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Account & Timer</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by company, industry, or contact..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
          />
        </div>

        {/* Filter Dropdowns & Due Today Toggle */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          >
            <option value="All">All Statuses</option>
            <option value="New">New</option>
            <option value="Ready">Ready</option>
            <option value="Contacted">Contacted</option>
            <option value="Replied">Replied</option>
            <option value="Meeting">Meeting</option>
          </select>

          <select
            value={tempFilter}
            onChange={(e) => setTempFilter(e.target.value)}
            className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          >
            <option value="All">All ICP Temps</option>
            <option value="HOT">HOT (75+)</option>
            <option value="WARM">WARM (45-74)</option>
            <option value="COLD">COLD (&lt;45)</option>
            <option value="DISQUALIFIED">DISQUALIFIED</option>
          </select>

          <button
            onClick={() => setDueTodayOnly(!dueTodayOnly)}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${
              dueTodayOnly
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <CalendarClock className="w-3.5 h-3.5" />
            <span>Due Today</span>
          </button>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th 
                  onClick={() => toggleSort('company')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>Company</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Primary Stakeholder</th>
                <th className="py-3 px-4">Deel Product Wedge</th>
                <th 
                  onClick={() => toggleSort('score')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>ICP Score</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Temp</th>
                <th className="py-3 px-4">Status</th>
                <th 
                  onClick={() => toggleSort('due')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>Next Follow-Up</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400 text-sm">
                    No target accounts found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((account) => {
                  const primaryContact = account.contacts && account.contacts[0];
                  const isOverdue = account.follow_up_due && account.follow_up_due <= todayStr && account.status !== 'Meeting';

                  return (
                    <tr key={account.id} className="hover:bg-slate-50/75 transition-colors">
                      {/* Company */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => onSelectAccount(account.id)}
                            className="hover:text-blue-600 transition-colors text-left"
                          >
                            {account.company_name}
                          </button>
                          {account.is_sample === 1 && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-slate-100 text-slate-600 border border-slate-200">
                              SAMPLE
                            </span>
                          )}
                          {account.website && (
                            <a
                              href={account.website.startsWith('http') ? account.website : `https://${account.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-400 hover:text-slate-600 transition-colors"
                              title="Visit website"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 font-normal">
                          {account.industry || 'B2B'} • {account.company_size || 'Size n/a'}
                        </div>
                      </td>

                      {/* Primary Contact */}
                      <td className="py-3.5 px-4">
                        {primaryContact ? (
                          <div>
                            <div className="font-semibold text-slate-900 text-xs">
                              {primaryContact.full_name}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {primaryContact.title}
                            </div>
                            <span className="inline-block mt-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                              {primaryContact.persona}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No contact assigned</span>
                        )}
                      </td>

                      {/* Deel Product Wedge */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-1 text-xs font-bold rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                          {account.recommended_product}
                        </span>
                      </td>

                      {/* Lead Score */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm tabular-nums text-slate-900 w-7">
                            {account.lead_score}
                          </span>
                          <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                account.lead_score >= 75
                                  ? 'bg-rose-600'
                                  : account.lead_score >= 45
                                  ? 'bg-amber-500'
                                  : 'bg-slate-400'
                              }`}
                              style={{ width: `${Math.min(account.lead_score, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Temperature */}
                      <td className="py-3.5 px-4">
                        {renderTempBadge(account.temperature)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <select
                          value={account.status}
                          onChange={(e) => onUpdateStatus(account.id, e.target.value)}
                          className={`text-xs font-semibold py-1 px-2.5 rounded-md border focus:outline-none transition-colors ${
                            account.status === 'Ready'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : account.status === 'Contacted'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : account.status === 'Replied'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : account.status === 'Meeting'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          <option value="New">New</option>
                          <option value="Ready">Ready</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Replied">Replied</option>
                          <option value="Meeting">Meeting</option>
                        </select>
                      </td>

                      {/* Follow-up Due */}
                      <td className="py-3.5 px-4">
                        <div className={`text-xs font-medium ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                          {account.follow_up_due || 'Not scheduled'}
                          {isOverdue && <span className="block text-[10px] text-rose-500 font-semibold">Action Due</span>}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => onSelectAccount(account.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                            title="View Account & Brief"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteAccount(account.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
