import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { AccountsTableView } from './components/AccountsTableView';
import { AddAccountView } from './components/AddAccountView';
import { AccountDetailView } from './components/AccountDetailView';
import { 
  fetchAnalytics, 
  fetchAccounts, 
  fetchAccount, 
  createAccount, 
  updateAccount,
  updateAccountStatus, 
  updateSignals, 
  deleteAccount, 
  deleteSampleData, 
  restoreSampleData 
} from './api/client';
import type { Account, DashboardAnalytics, CreateAccountPayload } from './types';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'accounts' | 'add-account' | 'account-detail'>('dashboard');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [dueTodayFilter, setDueTodayFilter] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadAllData = useCallback(async () => {
    try {
      const [analyticsData, accountsData] = await Promise.all([
        fetchAnalytics(),
        fetchAccounts()
      ]);
      setAnalytics(analyticsData);
      setAccounts(accountsData);

      if (selectedAccountId) {
        const refreshed = await fetchAccount(selectedAccountId);
        setSelectedAccount(refreshed);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  }, [selectedAccountId]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleSelectAccount = async (id: number) => {
    try {
      const acc = await fetchAccount(id);
      setSelectedAccountId(id);
      setSelectedAccount(acc);
      setCurrentView('account-detail');
    } catch (err) {
      showToast('Could not load account details', 'error');
    }
  };

  const handleToggleSignal = async (signalKey: string) => {
    if (!selectedAccount) return;
    const currentSignals = [...(selectedAccount.buying_signals || [])];
    const exists = currentSignals.includes(signalKey);
    const updatedSignals = exists 
      ? currentSignals.filter(k => k !== signalKey)
      : [...currentSignals, signalKey];

    try {
      const updated = await updateSignals(selectedAccount.id, updatedSignals, selectedAccount.red_flags || []);
      setSelectedAccount(updated);
      setAccounts(prev => prev.map(a => a.id === updated.id ? updated : a));
      const updatedAnalytics = await fetchAnalytics();
      setAnalytics(updatedAnalytics);
    } catch (err) {
      showToast('Failed to update buying signal', 'error');
    }
  };

  const handleToggleRedFlag = async (flagKey: string) => {
    if (!selectedAccount) return;
    const currentFlags = [...(selectedAccount.red_flags || [])];
    const exists = currentFlags.includes(flagKey);
    const updatedFlags = exists 
      ? currentFlags.filter(k => k !== flagKey)
      : [...currentFlags, flagKey];

    try {
      const updated = await updateSignals(selectedAccount.id, selectedAccount.buying_signals || [], updatedFlags);
      setSelectedAccount(updated);
      setAccounts(prev => prev.map(a => a.id === updated.id ? updated : a));
      const updatedAnalytics = await fetchAnalytics();
      setAnalytics(updatedAnalytics);
    } catch (err) {
      showToast('Failed to update red flag', 'error');
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedAccount) return;
    try {
      const updated = await updateAccountStatus(selectedAccount.id, status);
      setSelectedAccount(updated);
      setAccounts(prev => prev.map(a => a.id === updated.id ? updated : a));
      const updatedAnalytics = await fetchAnalytics();
      setAnalytics(updatedAnalytics);
      showToast(`Status updated to "${status}"`);
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  const handleTableStatusUpdate = async (id: number, status: string) => {
    try {
      const updated = await updateAccountStatus(id, status);
      if (selectedAccount && selectedAccount.id === id) {
        setSelectedAccount(updated);
      }
      setAccounts(prev => prev.map(a => a.id === updated.id ? updated : a));
      const updatedAnalytics = await fetchAnalytics();
      setAnalytics(updatedAnalytics);
      showToast(`Status updated to "${status}"`);
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  const handleUpdateCadence = async (step: number, followUpDate?: string) => {
    if (!selectedAccount) return;
    try {
      const updated = await updateAccount(selectedAccount.id, {
        cadence_step: step,
        follow_up_due: followUpDate || selectedAccount.follow_up_due
      });
      setSelectedAccount(updated);
      setAccounts(prev => prev.map(a => a.id === updated.id ? updated : a));
      const updatedAnalytics = await fetchAnalytics();
      setAnalytics(updatedAnalytics);
      showToast(`Cadence step updated to Step ${step}`);
    } catch (err) {
      showToast('Failed to update cadence', 'error');
    }
  };

  const handleUpdateQualification = async (field: string, val: string) => {
    if (!selectedAccount) return;
    try {
      const updated = await updateAccount(selectedAccount.id, {
        [field]: val
      } as any);
      setSelectedAccount(updated);
      setAccounts(prev => prev.map(a => a.id === updated.id ? updated : a));
    } catch (err) {
      showToast('Failed to save qualification field', 'error');
    }
  };

  const handleDeleteAccount = async (id: number) => {
    if (!window.confirm('Delete this target account and all associated contacts?')) return;
    try {
      await deleteAccount(id);
      if (selectedAccountId === id) {
        setSelectedAccountId(null);
        setSelectedAccount(null);
        setCurrentView('accounts');
      }
      await loadAllData();
      showToast('Account deleted');
    } catch (err) {
      showToast('Failed to delete account', 'error');
    }
  };

  const handleDeleteSample = async () => {
    if (!window.confirm('Delete all pre-seeded Deel sample data? You can reload it anytime.')) return;
    try {
      const res = await deleteSampleData();
      if (selectedAccount?.is_sample === 1) {
        setSelectedAccountId(null);
        setSelectedAccount(null);
        setCurrentView('dashboard');
      }
      await loadAllData();
      showToast(res.message);
    } catch (err) {
      showToast('Failed to delete sample data', 'error');
    }
  };

  const handleRestoreSample = async () => {
    try {
      await restoreSampleData();
      await loadAllData();
      showToast('Deel sample account reloaded');
    } catch (err) {
      showToast('Failed to reload sample data', 'error');
    }
  };

  const handleCreateAccount = async (payload: CreateAccountPayload) => {
    try {
      const created = await createAccount(payload);
      await loadAllData();
      showToast(`Account "${created.company_name}" created & scored`);
      handleSelectAccount(created.id);
    } catch (err) {
      showToast('Failed to create account', 'error');
      throw err;
    }
  };

  const hasSampleData = accounts.some(a => a.is_sample === 1);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          setDueTodayFilter(false);
          setSelectedAccountId(null);
          setSelectedAccount(null);
        }}
        onDeleteSample={handleDeleteSample}
        onRestoreSample={handleRestoreSample}
        hasSampleData={hasSampleData}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Toast Alert */}
        {toast && (
          <div className="fixed top-4 right-4 z-50 flex items-center space-x-2 px-4 py-2.5 rounded-lg shadow-lg border text-xs font-semibold animate-in fade-in slide-in-from-top duration-200 bg-white border-slate-200 text-slate-800">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        )}

        {/* View Content Container */}
        <div className="p-8 max-w-7xl w-full mx-auto">
          {currentView === 'dashboard' && (
            <DashboardView
              analytics={analytics}
              accounts={accounts}
              onSelectAccount={handleSelectAccount}
              onNavigate={(v) => {
                setCurrentView(v);
                setDueTodayFilter(false);
              }}
              onFilterDueToday={() => {
                setDueTodayFilter(true);
                setCurrentView('accounts');
              }}
            />
          )}

          {currentView === 'accounts' && (
            <AccountsTableView
              accounts={accounts}
              onSelectAccount={handleSelectAccount}
              onUpdateStatus={handleTableStatusUpdate}
              onDeleteAccount={handleDeleteAccount}
              onNavigateAdd={() => setCurrentView('add-account')}
              initialDueToday={dueTodayFilter}
            />
          )}

          {currentView === 'add-account' && (
            <AddAccountView
              onBack={() => setCurrentView('accounts')}
              onSubmit={handleCreateAccount}
            />
          )}

          {currentView === 'account-detail' && selectedAccount && (
            <AccountDetailView
              account={selectedAccount}
              onBack={() => setCurrentView('accounts')}
              onToggleSignal={handleToggleSignal}
              onToggleRedFlag={handleToggleRedFlag}
              onUpdateStatus={handleUpdateStatus}
              onUpdateCadence={handleUpdateCadence}
              onUpdateQualification={handleUpdateQualification}
              onRefreshAccount={loadAllData}
              onShowToast={showToast}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
