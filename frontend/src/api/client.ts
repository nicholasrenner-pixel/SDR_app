import type { Account, DashboardAnalytics, CreateAccountPayload } from '../types';

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
}): Promise<Account[]> {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.status && params.status !== 'All') query.append('status', params.status);
  if (params?.temperature && params.temperature !== 'All') query.append('temperature', params.temperature);

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

export async function updateAccountStatus(id: number, status: string): Promise<Account> {
  const res = await fetch(`${API_BASE}/accounts/${id}/status?status=${encodeURIComponent(status)}`, {
    method: 'PATCH',
  });
  if (!res.ok) throw new Error('Failed to update account status');
  return res.json();
}

export async function updateSignals(id: number, signals: Record<string, boolean>): Promise<Account> {
  const res = await fetch(`${API_BASE}/accounts/${id}/signals`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ signals }),
  });
  if (!res.ok) throw new Error('Failed to update buying signals');
  return res.json();
}

export async function generateBrief(id: number): Promise<Account> {
  const res = await fetch(`${API_BASE}/accounts/${id}/generate-brief`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to generate brief');
  return res.json();
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

export function getExportBriefUrl(id: number): string {
  return `${API_BASE}/accounts/${id}/export-brief`;
}
