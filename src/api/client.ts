import {
  DashboardStats,
  Transaction,
  TransactionDetailResponse,
  CleaningResult,
  FraudEngineConfig,
  SuspiciousAlert,
  StarSchemaOverview,
  User,
} from '../types';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('finguard_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errMessage = `HTTP error ${res.status}`;
    try {
      const errJson = await res.json();
      if (errJson.error) errMessage = errJson.error;
    } catch {}
    throw new Error(errMessage);
  }

  return res.json();
}

export const api = {
  // Auth
  async login(email: string, password: string, portal?: 'admin' | 'user'): Promise<{ token: string; user: User }> {
    const data = await request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, portal }),
    });
    localStorage.setItem('finguard_token', data.token);
    return data;
  },

  async register(fullName: string, email: string, password: string, confirmPassword: string, role?: string): Promise<{ token: string; user: User }> {
    const data = await request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, password, confirmPassword, role }),
    });
    localStorage.setItem('finguard_token', data.token);
    return data;
  },

  async getMe(): Promise<{ user: User }> {
    return request<{ user: User }>('/auth/me');
  },

  async getDemoCredentials(): Promise<{
    admin: { email: string; password: string; role: string; label: string };
    analyst: { email: string; password: string; role: string; label: string };
    user: { email: string; password: string; role: string; label: string };
  }> {
    return request('/auth/demo-credentials');
  },

  logout() {
    localStorage.removeItem('finguard_token');
  },

  async updateProfile(userId: string, fullName: string, email: string) {
    return request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ userId, fullName, email }),
    });
  },

  async updatePassword(userId: string, currentPassword: string, newPassword: string) {
    return request('/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ userId, currentPassword, newPassword }),
    });
  },

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    return request<DashboardStats>('/dashboard/stats');
  },

  // Transactions
  async getTransactions(params: {
    page?: number;
    limit?: number;
    search?: string;
    riskLevel?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<{ data: Transaction[]; pagination: { total: number; page: number; limit: number; totalPages: number } }> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.search) query.set('search', params.search);
    if (params.riskLevel) query.set('riskLevel', params.riskLevel);
    if (params.type) query.set('type', params.type);
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);

    return request(`/transactions?${query.toString()}`);
  },

  async getTransactionDetails(id: string): Promise<TransactionDetailResponse> {
    return request<TransactionDetailResponse>(`/transactions/${encodeURIComponent(id)}`);
  },

  async createTransaction(txn: {
    account_id: string;
    transaction_amount: number;
    location: string;
    transaction_type: string;
    transaction_date?: string;
    transaction_time?: string;
  }) {
    return request<TransactionDetailResponse>('/transactions', {
      method: 'POST',
      body: JSON.stringify(txn),
    });
  },

  // ETL
  async parseCSV(csvContent: string, filename?: string): Promise<{
    filename: string;
    totalRows: number;
    columnCount: number;
    headers: string[];
    preview: any[];
  }> {
    return request('/etl/parse-csv', {
      method: 'POST',
      body: JSON.stringify({ csvContent, filename }),
    });
  },

  async cleanCSV(rows: any[]): Promise<CleaningResult> {
    return request<CleaningResult>('/etl/clean', {
      method: 'POST',
      body: JSON.stringify({ rows }),
    });
  },

  async transformAndLoad(payload: {
    cleanTransactions: Transaction[];
    filename: string;
    missingCount: number;
    duplicateCount: number;
    invalidAmountCount: number;
    invalidDateCount: number;
  }) {
    return request<{ success: boolean; uploadId: string; insertedCount: number; durationMs: number; warehouseFactsCount: number }>(
      '/etl/transform-and-load',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  },

  async getETLHistory() {
    return request<{ uploads: any[]; etlMetrics: any[] }>('/etl/history');
  },

  async getETLAggregations() {
    return request<{
      byDate: any[];
      byType: any[];
      topLocations: any[];
      topAccounts: any[];
    }>('/etl/aggregations');
  },

  // Fraud Detection & Anomaly
  async getFraudConfig(): Promise<FraudEngineConfig> {
    return request<FraudEngineConfig>('/fraud/config');
  },

  async updateFraudConfig(config: FraudEngineConfig) {
    return request<{ message: string; config: FraudEngineConfig }>('/fraud/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  },

  async runBatchAnalysis() {
    return request<{
      analyzedCount: number;
      durationMs: number;
      anomaliesDetected: {
        amountAnomalies: number;
        locationAnomalies: number;
        timeAnomalies: number;
        burstAnomalies: number;
        typeAnomalies: number;
      };
    }>('/fraud/analyze-batch', { method: 'POST' });
  },

  // Alerts
  async getAlerts(status?: string): Promise<SuspiciousAlert[]> {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return request<SuspiciousAlert[]>(`/alerts${query}`);
  },

  async updateAlertStatus(id: string, status: string, noteText?: string) {
    return request<{ message: string; alert: SuspiciousAlert }>(`/alerts/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, noteText }),
    });
  },

  async addAlertNote(id: string, actionTaken: string, notes: string) {
    return request(`/alerts/${encodeURIComponent(id)}/notes`, {
      method: 'POST',
      body: JSON.stringify({ actionTaken, notes }),
    });
  },

  // Data Warehouse & OLAP
  async getStarSchemaOverview(): Promise<StarSchemaOverview> {
    return request<StarSchemaOverview>('/warehouse/star-schema');
  },

  async runOLAPQuery(dimension: 'date' | 'location' | 'type'): Promise<any[]> {
    return request<any[]>('/warehouse/olap-query', {
      method: 'POST',
      body: JSON.stringify({ dimension }),
    });
  },

  // Reports
  async getReportsSummary() {
    return request<any>('/reports/summary');
  },

  // System
  async resetDemoData() {
    return request<{ message: string }>('/system/reset-demo', { method: 'POST' });
  },

  // Admin Management
  async getAdminUsers(): Promise<User[]> {
    return request<User[]>('/admin/users');
  },

  async createAdminUser(user: { fullName: string; email: string; password: string; role: string }): Promise<User> {
    return request<User>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  },

  async updateUserRole(id: string, role: string) {
    return request(`/admin/users/${encodeURIComponent(id)}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },

  async deleteUser(id: string) {
    return request(`/admin/users/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  async getAdminAuditLogs(): Promise<import('../types').AuditLogRecord[]> {
    return request<import('../types').AuditLogRecord[]>('/admin/audit-logs');
  },
};
