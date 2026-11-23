import React from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  UserPlus, 
  Trash2, 
  RotateCcw, 
  ShieldCheck, 
  TrendingUp 
} from 'lucide-react';

interface SidebarProps {
  currentView: 'dashboard' | 'accounts' | 'add-account' | 'account-detail';
  onNavigate: (view: 'dashboard' | 'accounts' | 'add-account') => void;
  onDeleteSample: () => void;
  onRestoreSample: () => void;
  hasSampleData: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  onDeleteSample,
  onRestoreSample,
  hasSampleData,
}) => {
  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none">
      <div>
        {/* Logo & Workspace Brand */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-white font-bold text-base tracking-tight leading-none">
                Prospecting Engine
              </h1>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                Executive SDR Workstation
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1.5">
          <button
            onClick={() => onNavigate('dashboard')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              currentView === 'dashboard'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span>Dashboard & Analytics</span>
          </button>

          <button
            onClick={() => onNavigate('accounts')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              currentView === 'accounts' || currentView === 'account-detail'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4 shrink-0" />
            <span>Accounts Table</span>
          </button>

          <button
            onClick={() => onNavigate('add-account')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              currentView === 'add-account'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4 shrink-0" />
            <span>Add Target Account</span>
          </button>
        </nav>
      </div>

      {/* Footer / Sample Data Management */}
      <div className="p-4 border-t border-slate-800 space-y-3">
        <div className="bg-slate-850 rounded-lg p-3 border border-slate-800 text-xs">
          <div className="flex items-center space-x-1.5 text-slate-400 font-medium mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Interview Proof of Work</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            100% locally grounded in research notes. Zero hallucinations or external API leaks.
          </p>
        </div>

        {hasSampleData ? (
          <button
            onClick={onDeleteSample}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Sample Data</span>
          </button>
        ) : (
          <button
            onClick={onRestoreSample}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-750 border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reload Sample Account</span>
          </button>
        )}
      </div>
    </aside>
  );
};
