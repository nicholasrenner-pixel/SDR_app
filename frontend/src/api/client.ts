import type { 
  Account, 
  Contact, 
  CallLog, 
  BriefData, 
  DashboardAnalytics, 
  CreateAccountPayload 
} from '../types';

const API_BASE = '/api';

export async function fetchAnalytics(): Promise<DashboardAnalytics> {
  const res = await fetch(`${API_BASE}/analytics`);
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}

export async function fetchAccounts(params?: {
  search?: string;
  status?: string;
  temperature?: string;
  due_today?: boolean;
}): Promise<Account[]> {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.status && params.status !== 'All') query.append('status', params.status);
  if (params?.temperature && params.temperature !== 'All') query.append('temperature', params.temperature);
  if (params?.due_today) query.append('due_today', 'true');

  const res = await fetch(`${API_BASE}/accounts?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch accounts');
  return res.json();
}

export async function fetchAccount(id: number): Promise<Account> {
  const res = await fetch(`${API_BASE}/accounts/${id}`);
  if (!res.ok) throw new Error('Failed to fetch account detail');
  return res.json();
}

export async function createAccount(payload: CreateAccountPayload): Promise<Account> {
  const res = await fetch(`${API_BASE}/accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create account');
  return res.json();
}

export async function updateAccount(id: number, payload: Partial<Account>): Promise<Account> {
  const res = await fetch(`${API_BASE}/accounts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to update account');
  return res.json();
}

export async function updateAccountStatus(id: number, status: string): Promise<Account> {
  const res = await fetch(`${API_BASE}/accounts/${id}/status?status=${encodeURIComponent(status)}`, {
    method: 'PATCH',
  });
  if (!res.ok) throw new Error('Failed to update account status');
  return res.json();
}

export async function updateSignals(
  id: number, 
  buying_signals: string[], 
  red_flags: string[]
): Promise<Account> {
  const res = await fetch(`${API_BASE}/accounts/${id}/signals`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ buying_signals, red_flags }),
  });
  if (!res.ok) throw new Error('Failed to update buying signals');
  return res.json();
}

export async function addContact(
  accountId: number, 
  payload: {
    full_name: string;
    title: string;
    persona: string;
    buying_role: string;
    linkedin_url?: string;
    outreach_status?: string;
  }
): Promise<Contact> {
  const res = await fetch(`${API_BASE}/accounts/${accountId}/contacts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to add contact');
  return res.json();
}

export async function updateContactStatus(
  accountId: number, 
  contactId: number, 
  status: string
): Promise<Contact> {
  const res = await fetch(`${API_BASE}/accounts/${accountId}/contacts/${contactId}?outreach_status=${encodeURIComponent(status)}`, {
    method: 'PATCH',
  });
  if (!res.ok) throw new Error('Failed to update contact status');
  return res.json();
}

export async function deleteContact(accountId: number, contactId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/accounts/${accountId}/contacts/${contactId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete contact');
}

export async function logCallOutcome(
  accountId: number, 
  payload: {
    contact_name?: string;
    outcome: string;
    notes?: string;
  }
): Promise<CallLog> {
  const res = await fetch(`${API_BASE}/accounts/${accountId}/call-logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to log call outcome');
  return res.json();
}

export async function fetchBrief(accountId: number, contactId?: number): Promise<BriefData> {
  const url = contactId 
    ? `${API_BASE}/accounts/${accountId}/brief?contact_id=${contactId}`
    : `${API_BASE}/accounts/${accountId}/brief`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch grounded brief');
  return res.json();
}

export function getExportBriefUrl(accountId: number, contactId?: number): string {
  return contactId 
    ? `${API_BASE}/accounts/${accountId}/export-brief?contact_id=${contactId}`
    : `${API_BASE}/accounts/${accountId}/export-brief`;
}

export async function fetchAEHandoff(accountId: number): Promise<string> {
  const res = await fetch(`${API_BASE}/accounts/${accountId}/ae-handoff`);
  if (!res.ok) throw new Error('Failed to fetch AE handoff packet');
  return res.text();
}

export async function deleteAccount(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/accounts/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete account');
}

export async function deleteSampleData(): Promise<{ message: string; deleted_count: number }> {
  const res = await fetch(`${API_BASE}/sample-data`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete sample data');
  return res.json();
}

export async function restoreSampleData(): Promise<void> {
  const res = await fetch(`${API_BASE}/sample-data/restore`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to restore sample data');
}
