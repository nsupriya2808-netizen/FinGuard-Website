export type RiskLevel = 'Low' | 'Medium' | 'High';
export type TransactionType = 'POS' | 'Online' | 'ATM' | 'Wire Transfer' | 'Mobile Transfer';
export type InvestigationStatus = 'Pending' | 'Under Review' | 'Confirmed Fraud' | 'False Positive / Resolved';

export type UserRole = 'admin' | 'analyst' | 'user' | 'fraud_investigator';

export interface User {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
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

export interface Transaction {
  transaction_id: string;
  account_id: string;
  transaction_amount: number;
  transaction_date: string; // YYYY-MM-DD
  transaction_time: string; // HH:MM:SS
  location: string;
  transaction_type: TransactionType;
  source_upload_id?: string;
  created_at: string;
}

export interface RiskFactor {
  factor: string;
  points: number;
  description: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface RiskAnalysis {
  transaction_id: string;
  risk_score: number; // 0 to 100
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

export interface SuspiciousAlert {
  alert_id: string;
  transaction_id: string;
  investigation_status: InvestigationStatus;
  assigned_to?: string;
  notes_count: number;
  created_at: string;
  updated_at: string;
}

export interface InvestigationNote {
  id: string;
  alert_id: string;
  investigator_email: string;
  action_taken: string;
  notes: string;
  logged_at: string;
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

// Data Warehouse Star Schema Types
export interface DimDate {
  date_key: number; // YYYYMMDD
  full_date: string;
  day_of_month: number;
  day_name: string;
  day_of_week: number;
  is_weekend: boolean;
  month_number: number;
  month_name: string;
  quarter: number;
  year_val: number;
}

export interface DimAccount {
  account_key: number;
  account_id: string;
  customer_segment: 'Retail' | 'Business' | 'Corporate' | 'Private Banking';
  risk_tier: 'Low' | 'Standard' | 'Elevated' | 'High';
  first_active_date: string;
}

export interface DimLocation {
  location_key: number;
  city_name: string;
  country: string;
  region: string;
  jurisdiction_risk_level: 'Low' | 'Medium' | 'High' | 'Sanctioned';
}

export interface DimTransactionType {
  type_key: number;
  type_name: TransactionType;
  channel_category: 'Card-Present' | 'Digital-CNP' | 'Automated-Cash' | 'Interbank-Wire';
  is_immediate_settlement: boolean;
  historical_fraud_rate_pct: number;
}

export interface FactTransaction {
  fact_id: number;
  transaction_key: string;
  date_key: number;
  account_key: number;
  location_key: number;
  type_key: number;
  amount: number;
  risk_score: number;
  risk_level: RiskLevel;
  is_suspicious: boolean;
  is_confirmed_fraud: boolean;
  etl_load_timestamp: string;
}

export interface FraudEngineConfig {
  highAmountThreshold: number; // default $5,000
  veryHighAmountThreshold: number; // default $10,000
  nightHourStart: number; // 01 (1 AM)
  nightHourEnd: number; // 05 (5 AM)
  burstWindowMinutes: number; // default 5 minutes
  burstMaxTransactions: number; // default 3
  weights: {
    amountWeight: number;
    timeWeight: number;
    locationWeight: number;
    frequencyWeight: number;
    typeWeight: number;
  };
}
