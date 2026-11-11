export type RiskLevel = 'Low' | 'Medium' | 'High';
export type TransactionType = 'POS' | 'Online' | 'ATM' | 'Wire Transfer' | 'Mobile Transfer';
export type InvestigationStatus = 'Pending' | 'Under Review' | 'Confirmed Fraud' | 'False Positive / Resolved';

export type UserRole = 'admin' | 'analyst' | 'user' | 'fraud_investigator';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  createdAt?: string;
  lastLogin?: string;
}

export interface AuditLogRecord {
  id: string;
  userEmail: string;
  action: string;
  details: string;
  timestamp: string;
  status: 'SUCCESS' | 'WARNING' | 'CRITICAL';
}

export interface RiskFactor {
  factor: string;
  points: number;
  description: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface RiskAnalysis {
  transaction_id: string;
  risk_score: number;
  risk_level: RiskLevel;
  anomaly_amount_flag: boolean;
  anomaly_location_flag: boolean;
  anomaly_time_flag: boolean;
  anomaly_frequency_flag: boolean;
  anomaly_type_flag: boolean;
  reasons: RiskFactor[];
  model_version: string;
  analyzed_at: string;
}

export interface Transaction {
  transaction_id: string;
  account_id: string;
  transaction_amount: number;
  transaction_date: string;
  transaction_time: string;
  location: string;
  transaction_type: TransactionType;
  source_upload_id?: string;
  created_at?: string;
  analysis?: RiskAnalysis;
}

export interface SuspiciousAlert {
  alert_id: string;
  transaction_id: string;
  investigation_status: InvestigationStatus;
  assigned_to?: string;
  notes_count: number;
  created_at: string;
  updated_at: string;
  transaction?: Transaction | null;
  analysis?: RiskAnalysis | null;
}

export interface InvestigationNote {
  id: string;
  alert_id: string;
  investigator_email: string;
  action_taken: string;
  notes: string;
  logged_at: string;
}

export interface TransactionDetailResponse {
  transaction: Transaction;
  analysis: RiskAnalysis | null;
  alert: SuspiciousAlert | null;
  notes: InvestigationNote[];
  accountHistoryCount: number;
  accountTotalVolume: number;
}

export interface DashboardStats {
  kpis: {
    totalTransactions: number;
    normalTransactions: number;
    suspiciousTransactions: number;
    highRiskTransactions: number;
    totalTransactionAmount: number;
  };
  charts: {
    dailyTrends: Array<{ date: string; total: number; amount: number; suspicious: number }>;
    riskDistribution: Array<{ name: string; value: number; color: string }>;
    typeAnalysis: Array<{ type: string; count: number; amount: number }>;
  };
  recentTransactions: Transaction[];
  recentAlerts: SuspiciousAlert[];
}

export interface CleaningIssue {
  rowNumber: number;
  transactionId?: string;
  field: string;
  issueType: 'missing_value' | 'duplicate_record' | 'invalid_amount' | 'invalid_date' | 'missing_account' | 'invalid_type';
  rawValue: string;
  message: string;
}

export interface CleaningResult {
  totalRows: number;
  missingValuesCount: number;
  duplicateRecordsCount: number;
  invalidAmountsCount: number;
  invalidDatesCount: number;
  missingAccountsCount: number;
  cleanRecordsCount: number;
  issues: CleaningIssue[];
  validRows: any[];
  cleanTransactions: Transaction[];
}

export interface ETLRecordMetrics {
  upload_id: string;
  missing_values_count: number;
  duplicate_records_count: number;
  invalid_amounts_count: number;
  invalid_dates_count: number;
  cleaned_records_count: number;
  processing_duration_ms: number;
  executed_at: string;
}

export interface DataUploadRecord {
  upload_id: string;
  filename: string;
  uploaded_by: string;
  total_rows: number;
  valid_rows: number;
  rejected_rows: number;
  status: 'pending' | 'cleaning' | 'transformed' | 'loaded' | 'failed';
  upload_time: string;
}

export interface FraudEngineConfig {
  highAmountThreshold: number;
  veryHighAmountThreshold: number;
  nightHourStart: number;
  nightHourEnd: number;
  burstWindowMinutes: number;
  burstMaxTransactions: number;
  weights: {
    amountWeight: number;
    timeWeight: number;
    locationWeight: number;
    frequencyWeight: number;
    typeWeight: number;
  };
}

export interface StarSchemaOverview {
  factCount: number;
  dimDateCount: number;
  dimAccountCount: number;
  dimLocationCount: number;
  dimTypeCount: number;
  dimensions: {
    dates: any[];
    accounts: any[];
    locations: any[];
    types: any[];
  };
  sampleFacts: any[];
}
