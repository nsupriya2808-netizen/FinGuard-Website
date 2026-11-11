import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

import type {
  User,
  UserRole,
  AuditLogRecord,
  Transaction,
  RiskAnalysis,
  SuspiciousAlert,
  InvestigationNote,
  DataUploadRecord,
  ETLRecordMetrics,
  FraudEngineConfig,
  DimDate,
  DimAccount,
  DimLocation,
  DimTransactionType,
  FactTransaction,
  RiskLevel,
  TransactionType,
  InvestigationStatus,
} from './types.ts';
import { hashPassword, verifyPassword } from './auth.ts';
import { generateSyntheticTransactions } from './seed.ts';
import { analyzeTransaction, DEFAULT_FRAUD_CONFIG } from './fraudEngine.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'finguard_db.json');

/**
 * Returns the configured system demo accounts, honoring Render environment variables
 * with clean sanitization (stripping surrounding quotes and whitespace).
 */
export function getConfiguredCredentials() {
  const adminPassword = (process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@FinGuard2026').trim().replace(/^["']|["']$/g, '');
  const analystPassword = (process.env.DEFAULT_ANALYST_PASSWORD || 'FinGuard@2026').trim().replace(/^["']|["']$/g, '');
  const userPassword = (process.env.DEFAULT_USER_PASSWORD || 'User@FinGuard2026').trim().replace(/^["']|["']$/g, '');

  return {
    admin: {
      id: 'USR100',
      fullName: 'Chief Compliance Administrator',
      email: 'admin@finguard.bank',
      password: adminPassword,
      role: 'admin' as const,
    },
    analyst: {
      id: 'USR101',
      fullName: 'Senior Fraud Analyst',
      email: 'analyst@finguard.bank',
      password: analystPassword,
      role: 'analyst' as const,
    },
    user: {
      id: 'USR102',
      fullName: 'Auditor & Compliance Staff',
      email: 'user@finguard.bank',
      password: userPassword,
      role: 'user' as const,
    },
  };
}

export interface DatabaseState {
  users: User[];
  auditLogs: AuditLogRecord[];
  transactions: Transaction[];
  riskAnalyses: Record<string, RiskAnalysis>;
  alerts: SuspiciousAlert[];
  investigationNotes: InvestigationNote[];
  dataUploadHistory: DataUploadRecord[];
  etlProcessingHistory: ETLRecordMetrics[];
  fraudConfig: FraudEngineConfig;
  // Warehouse Star Schema
  dimDate: DimDate[];
  dimAccount: DimAccount[];
  dimLocation: DimLocation[];
  dimTransactionType: DimTransactionType[];
  factTransactions: FactTransaction[];
}

class DatabaseManager {
  private state: DatabaseState = {
    users: [],
    auditLogs: [],
    transactions: [],
    riskAnalyses: {},
    alerts: [],
    investigationNotes: [],
    dataUploadHistory: [],
    etlProcessingHistory: [],
    fraudConfig: { ...DEFAULT_FRAUD_CONFIG },
    dimDate: [],
    dimAccount: [],
    dimLocation: [],
    dimTransactionType: [],
    factTransactions: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.state = JSON.parse(raw);
        console.log(`[Database] Loaded ${this.state.transactions?.length || 0} transactions from disk.`);
        if (!Array.isArray(this.state.users)) {
          this.state.users = [];
        }
        if (!Array.isArray(this.state.transactions)) {
          this.state.transactions = [];
        }

        // Always synchronize system accounts to reflect any Render environment variables without wiping user-registered accounts!
        this.syncSystemAccounts();

        if (this.state.transactions.length === 0) {
          this.seedInitialData();
        }
      } catch (err) {
        console.error('[Database] Failed to read existing db file, re-initializing...', err);
        this.seedInitialData();
      }
    } else {
      this.seedInitialData();
    }
  }

  public save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Database] Failed to persist database state:', err);
    }
  }

  /**
   * Synchronizes system administrator, analyst, and standard user accounts
   * with the active environment variables (e.g. from Render dashboard)
   * while strictly preserving all other user accounts.
   */
  public syncSystemAccounts() {
    const creds = getConfiguredCredentials();
    if (!Array.isArray(this.state.users)) {
      this.state.users = [];
    }

    // 1. Admin account
    let admin = this.state.users.find((u) => u.email.toLowerCase() === creds.admin.email.toLowerCase());
    if (!admin) {
      admin = {
        id: creds.admin.id,
        fullName: creds.admin.fullName,
        email: creds.admin.email,
        passwordHash: hashPassword(creds.admin.password),
        role: creds.admin.role,
        createdAt: '2026-09-01T08:00:00Z',
        lastLogin: new Date().toISOString(),
      };
      this.state.users.unshift(admin);
      console.log(`[Database] Initialized default Administrator account: ${creds.admin.email}`);
    } else {
      admin.role = 'admin';
      // Sync password if explicitly specified via Render env var, or if hash does not match
      if (process.env.DEFAULT_ADMIN_PASSWORD || !verifyPassword(creds.admin.password, admin.passwordHash)) {
        admin.passwordHash = hashPassword(creds.admin.password);
      }
    }

    // 2. Analyst account
    let analyst = this.state.users.find((u) => u.email.toLowerCase() === creds.analyst.email.toLowerCase());
    if (!analyst) {
      analyst = {
        id: creds.analyst.id,
        fullName: creds.analyst.fullName,
        email: creds.analyst.email,
        passwordHash: hashPassword(creds.analyst.password),
        role: creds.analyst.role,
        createdAt: '2026-10-01T08:00:00Z',
        lastLogin: new Date().toISOString(),
      };
      this.state.users.push(analyst);
      console.log(`[Database] Initialized default Analyst account: ${creds.analyst.email}`);
    } else {
      analyst.role = 'analyst';
      if (process.env.DEFAULT_ANALYST_PASSWORD || !verifyPassword(creds.analyst.password, analyst.passwordHash)) {
        analyst.passwordHash = hashPassword(creds.analyst.password);
      }
    }

    // 3. User account
    let standard = this.state.users.find((u) => u.email.toLowerCase() === creds.user.email.toLowerCase());
    if (!standard) {
      standard = {
        id: creds.user.id,
        fullName: creds.user.fullName,
        email: creds.user.email,
        passwordHash: hashPassword(creds.user.password),
        role: creds.user.role,
        createdAt: '2026-10-15T09:30:00Z',
        lastLogin: new Date().toISOString(),
      };
      this.state.users.push(standard);
      console.log(`[Database] Initialized default User account: ${creds.user.email}`);
    } else {
      standard.role = 'user';
      if (process.env.DEFAULT_USER_PASSWORD || !verifyPassword(creds.user.password, standard.passwordHash)) {
        standard.passwordHash = hashPassword(creds.user.password);
      }
    }

    this.save();
  }

  public seedInitialData() {
    console.log('[Database] Seeding initial FinGuard dataset (Admin, Analyst, Users, 520+ transactions)...');
    const creds = getConfiguredCredentials();

    // 1. Ensure system accounts are initialized
    this.syncSystemAccounts();

    // Seed Security & System Audit Logs
    this.state.auditLogs = [
      {
        id: 'AUD1001',
        userEmail: 'admin@finguard.bank',
        action: 'SYSTEM_BOOTSTRAP',
        details: 'FinGuard security terminal initialized with RBAC partitions (Admin, Analyst, User).',
        timestamp: '2026-10-01T08:00:00Z',
        status: 'SUCCESS',
      },
      {
        id: 'AUD1002',
        userEmail: 'admin@finguard.bank',
        action: 'STAR_SCHEMA_SYNC',
        details: 'Fact_Transactions mapped to Dim_Date, Dim_Account, Dim_Location, Dim_Type.',
        timestamp: '2026-10-01T08:05:00Z',
        status: 'SUCCESS',
      },
      {
        id: 'AUD1003',
        userEmail: 'analyst@finguard.bank',
        action: 'ETL_INSPECTION',
        details: 'Executed automated batch data quality rules on Q4 transactions ledger.',
        timestamp: '2026-10-15T10:14:00Z',
        status: 'SUCCESS',
      },
      {
        id: 'AUD1004',
        userEmail: 'analyst@finguard.bank',
        action: 'ANOMALY_ESCALATION',
        details: 'Flagged transaction TXN10003 ($12,000.00 Wire Transfer to Moscow) as High Risk.',
        timestamp: '2026-10-20T14:22:00Z',
        status: 'WARNING',
      },
    ];

    // 2. Generate Synthetic Transactions
    const txns = generateSyntheticTransactions();
    this.state.transactions = txns;

    // 3. Build Account History Map for Fraud Engine
    const accountMap = new Map<string, Transaction[]>();
    txns.forEach((t) => {
      if (!accountMap.has(t.account_id)) {
        accountMap.set(t.account_id, []);
      }
      accountMap.get(t.account_id)!.push(t);
    });

    // 4. Run Fraud Engine on each transaction & build Suspicious Alerts
    this.state.riskAnalyses = {};
    this.state.alerts = [];
    this.state.investigationNotes = [];

    let alertCounter = 1;
    txns.forEach((txn) => {
      const history = accountMap.get(txn.account_id) || [];
      const analysis = analyzeTransaction(txn, history, this.state.fraudConfig);
      this.state.riskAnalyses[txn.transaction_id] = analysis;

      if (analysis.risk_level === 'High' || analysis.risk_level === 'Medium') {
        const alertId = `ALT${String(alertCounter++).padStart(4, '0')}`;
        // Mark some historical high-risk alerts as under review or resolved for realism
        let status: InvestigationStatus = 'Pending';
        if (analysis.risk_score >= 85) {
          status = Math.random() > 0.5 ? 'Under Review' : 'Pending';
        } else if (analysis.risk_level === 'Medium') {
          status = Math.random() > 0.7 ? 'False Positive / Resolved' : 'Pending';
        }

        this.state.alerts.push({
          alert_id: alertId,
          transaction_id: txn.transaction_id,
          investigation_status: status,
          assigned_to: creds.analyst.id,
          notes_count: 0,
          created_at: txn.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    });

    // 5. Add initial audit note to first high-risk alert
    const firstHighRiskAlert = this.state.alerts.find(
      (a) => this.state.riskAnalyses[a.transaction_id]?.risk_level === 'High'
    );
    if (firstHighRiskAlert) {
      firstHighRiskAlert.investigation_status = 'Under Review';
      firstHighRiskAlert.notes_count = 1;
      this.state.investigationNotes.push({
        id: 'NOTE1001',
        alert_id: firstHighRiskAlert.alert_id,
        investigator_email: creds.analyst.email,
        action_taken: 'Freeze Temporary Wire Authorization',
        notes: 'Contacted customer regarding large offshore wire transfer request. Awaiting customer identity confirmation.',
        logged_at: new Date().toISOString(),
      });
    }

    // 6. Record Initial Upload and ETL Run
    this.state.dataUploadHistory = [
      {
        upload_id: 'UPL1001',
        filename: 'production_q4_transactions.csv',
        uploaded_by: creds.analyst.email,
        total_rows: txns.length,
        valid_rows: txns.length,
        rejected_rows: 0,
        status: 'loaded',
        upload_time: '2026-10-01T08:30:00Z',
      },
    ];

    this.state.etlProcessingHistory = [
      {
        upload_id: 'UPL1001',
        missing_values_count: 0,
        duplicate_records_count: 0,
        invalid_amounts_count: 0,
        invalid_dates_count: 0,
        cleaned_records_count: txns.length,
        processing_duration_ms: 142,
        executed_at: '2026-10-01T08:31:00Z',
      },
    ];

    // 7. Synchronize Warehouse Star Schema
    this.syncWarehouseStarSchema();

    this.save();
    console.log(
      `[Database] Successfully seeded: ${this.state.transactions.length} transactions, ${this.state.alerts.length} alerts, ${this.state.factTransactions.length} warehouse facts.`
    );
  }

  /**
   * Builds or updates the Data Warehouse Star Schema from current operational transactions
   */
  public syncWarehouseStarSchema() {
    const datesMap = new Map<number, DimDate>();
    const accountsMap = new Map<string, DimAccount>();
    const locationsMap = new Map<string, DimLocation>();
    const typesMap = new Map<string, DimTransactionType>();

    let accKey = 1;
    let locKey = 1;
    let typeKey = 1;

    // Channel metadata mapping
    const channelMeta: Record<
      TransactionType,
      { category: DimTransactionType['channel_category']; fraudRate: number }
    > = {
      POS: { category: 'Card-Present', fraudRate: 0.8 },
      Online: { category: 'Digital-CNP', fraudRate: 4.2 },
      ATM: { category: 'Automated-Cash', fraudRate: 1.5 },
      'Wire Transfer': { category: 'Interbank-Wire', fraudRate: 6.8 },
      'Mobile Transfer': { category: 'Digital-CNP', fraudRate: 2.1 },
    };

    const facts: FactTransaction[] = [];

    this.state.transactions.forEach((txn, index) => {
      // 1. Date Dimension
      const d = new Date(txn.transaction_date);
      const dateKey = parseInt(txn.transaction_date.replace(/-/g, ''), 10) || 20261001;
      if (!datesMap.has(dateKey)) {
        const dayOfWeek = d.getDay();
        const monthNum = d.getMonth() + 1;
        datesMap.set(dateKey, {
          date_key: dateKey,
          full_date: txn.transaction_date,
          day_of_month: d.getDate(),
          day_name: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek],
          day_of_week: dayOfWeek + 1,
          is_weekend: dayOfWeek === 0 || dayOfWeek === 6,
          month_number: monthNum,
          month_name: [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
          ][monthNum - 1],
          quarter: Math.ceil(monthNum / 3),
          year_val: d.getFullYear(),
        });
      }

      // 2. Account Dimension
      if (!accountsMap.has(txn.account_id)) {
        const segs: DimAccount['customer_segment'][] = ['Retail', 'Business', 'Corporate', 'Private Banking'];
        const tiers: DimAccount['risk_tier'][] = ['Low', 'Standard', 'Elevated'];
        accountsMap.set(txn.account_id, {
          account_key: accKey++,
          account_id: txn.account_id,
          customer_segment: segs[Math.floor(Math.random() * segs.length)],
          risk_tier: tiers[Math.floor(Math.random() * tiers.length)],
          first_active_date: '2024-01-15',
        });
      }

      // 3. Location Dimension
      const locName = txn.location || 'Unknown';
      if (!locationsMap.has(locName)) {
        const isOffshore = ['Moscow', 'Lagos', 'Kyiv', 'Dubai', 'Zurich', 'Cayman Islands'].includes(locName);
        locationsMap.set(locName, {
          location_key: locKey++,
          city_name: locName,
          country: isOffshore ? 'International' : 'United States',
          region: isOffshore ? 'EMEA / Cross-Border' : 'North America',
          jurisdiction_risk_level: isOffshore ? 'High' : 'Low',
        });
      }

      // 4. Transaction Type Dimension
      if (!typesMap.has(txn.transaction_type)) {
        const meta = channelMeta[txn.transaction_type] || { category: 'Card-Present', fraudRate: 1.0 };
        typesMap.set(txn.transaction_type, {
          type_key: typeKey++,
          type_name: txn.transaction_type,
          channel_category: meta.category,
          is_immediate_settlement: txn.transaction_type !== 'Wire Transfer',
          historical_fraud_rate_pct: meta.fraudRate,
        });
      }

      // 5. Fact Transaction
      const analysis = this.state.riskAnalyses[txn.transaction_id] || {
        risk_score: 15,
        risk_level: 'Low',
      };
      const alert = this.state.alerts.find((a) => a.transaction_id === txn.transaction_id);

      facts.push({
        fact_id: index + 1,
        transaction_key: txn.transaction_id,
        date_key: dateKey,
        account_key: accountsMap.get(txn.account_id)!.account_key,
        location_key: locationsMap.get(locName)!.location_key,
        type_key: typesMap.get(txn.transaction_type)!.type_key,
        amount: Number(txn.transaction_amount),
        risk_score: analysis.risk_score,
        risk_level: analysis.risk_level,
        is_suspicious: analysis.risk_level !== 'Low',
        is_confirmed_fraud: alert?.investigation_status === 'Confirmed Fraud',
        etl_load_timestamp: new Date().toISOString(),
      });
    });

    this.state.dimDate = Array.from(datesMap.values()).sort((a, b) => b.date_key - a.date_key);
    this.state.dimAccount = Array.from(accountsMap.values());
    this.state.dimLocation = Array.from(locationsMap.values());
    this.state.dimTransactionType = Array.from(typesMap.values());
    this.state.factTransactions = facts;
  }

  // --- Users & Auth ---
  public findUserByEmail(email: string): User | undefined {
    return this.state.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  }

  public createUser(fullName: string, email: string, passwordHash: string, role: User['role'] = 'analyst'): User {
    const user: User = {
      id: `USR${100 + this.state.users.length + 1}`,
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role,
      createdAt: new Date().toISOString(),
    };
    this.state.users.push(user);
    this.save();
    return user;
  }

  public updateUserPassword(userId: string, newHash: string): boolean {
    const user = this.state.users.find((u) => u.id === userId);
    if (!user) return false;
    user.passwordHash = newHash;
    this.save();
    return true;
  }

  public updateUserProfile(userId: string, fullName: string, email: string): boolean {
    const user = this.state.users.find((u) => u.id === userId);
    if (!user) return false;
    user.fullName = fullName.trim();
    user.email = email.toLowerCase().trim();
    this.save();
    return true;
  }

  public getAllUsers(): User[] {
    return this.state.users.map((u) => ({
      ...u,
      passwordHash: '[PROTECTED]',
    }));
  }

  public updateUserRole(userId: string, role: UserRole): boolean {
    const user = this.state.users.find((u) => u.id === userId);
    if (!user) return false;
    user.role = role;
    this.save();
    return true;
  }

  public deleteUser(userId: string): boolean {
    const idx = this.state.users.findIndex((u) => u.id === userId);
    if (idx === -1) return false;
    this.state.users.splice(idx, 1);
    this.save();
    return true;
  }

  public addAuditLog(
    userEmail: string,
    action: string,
    details: string,
    status: 'SUCCESS' | 'WARNING' | 'CRITICAL' = 'SUCCESS'
  ) {
    const record: AuditLogRecord = {
      id: `AUD${1000 + (this.state.auditLogs?.length || 0) + 1}`,
      userEmail,
      action,
      details,
      timestamp: new Date().toISOString(),
      status,
    };
    if (!this.state.auditLogs) this.state.auditLogs = [];
    this.state.auditLogs.unshift(record);
    this.save();
    return record;
  }

  public getAuditLogs(): AuditLogRecord[] {
    return this.state.auditLogs || [];
  }

  // --- Transactions & Analytics ---
  public getAllTransactions(): Transaction[] {
    return this.state.transactions;
  }

  public getTransactionById(id: string) {
    const txn = this.state.transactions.find((t) => t.transaction_id === id);
    if (!txn) return null;
    const analysis = this.state.riskAnalyses[id] || null;
    const alert = this.state.alerts.find((a) => a.transaction_id === id) || null;
    const notes = alert ? this.state.investigationNotes.filter((n) => n.alert_id === alert.alert_id) : [];
    const accountHistory = this.state.transactions.filter((t) => t.account_id === txn.account_id);

    return {
      transaction: txn,
      analysis,
      alert,
      notes,
      accountHistoryCount: accountHistory.length,
      accountTotalVolume: accountHistory.reduce((s, t) => s + Number(t.transaction_amount), 0),
    };
  }

  public insertCleanedTransactions(newTxns: Transaction[], uploadId: string) {
    newTxns.forEach((t) => {
      t.source_upload_id = uploadId;
      this.state.transactions.unshift(t);
    });

    // Run fraud engine on new transactions
    const accountMap = new Map<string, Transaction[]>();
    this.state.transactions.forEach((t) => {
      if (!accountMap.has(t.account_id)) accountMap.set(t.account_id, []);
      accountMap.get(t.account_id)!.push(t);
    });

    let alertCounter = this.state.alerts.length + 1;
    newTxns.forEach((txn) => {
      const history = accountMap.get(txn.account_id) || [];
      const analysis = analyzeTransaction(txn, history, this.state.fraudConfig);
      this.state.riskAnalyses[txn.transaction_id] = analysis;

      if (analysis.risk_level === 'High' || analysis.risk_level === 'Medium') {
        this.state.alerts.unshift({
          alert_id: `ALT${String(alertCounter++).padStart(4, '0')}`,
          transaction_id: txn.transaction_id,
          investigation_status: 'Pending',
          notes_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    });

    this.syncWarehouseStarSchema();
    this.save();
  }

  // --- Alerts & Investigation Notes ---
  public getAlerts() {
    return this.state.alerts.map((alert) => {
      const txn = this.state.transactions.find((t) => t.transaction_id === alert.transaction_id);
      const analysis = this.state.riskAnalyses[alert.transaction_id];
      return {
        ...alert,
        transaction: txn || null,
        analysis: analysis || null,
      };
    });
  }

  public updateAlertStatus(alertId: string, status: InvestigationStatus, noteText?: string, investigatorEmail: string = 'analyst@finguard.bank') {
    const alert = this.state.alerts.find((a) => a.alert_id === alertId);
    if (!alert) return null;

    alert.investigation_status = status;
    alert.updated_at = new Date().toISOString();

    if (noteText && noteText.trim()) {
      alert.notes_count = (alert.notes_count || 0) + 1;
      this.state.investigationNotes.push({
        id: `NOTE${1000 + this.state.investigationNotes.length + 1}`,
        alert_id: alertId,
        investigator_email: investigatorEmail,
        action_taken: `Status changed to ${status}`,
        notes: noteText.trim(),
        logged_at: new Date().toISOString(),
      });
    }

    // Sync fact table confirmation status
    const fact = this.state.factTransactions.find((f) => f.transaction_key === alert.transaction_id);
    if (fact) {
      fact.is_confirmed_fraud = status === 'Confirmed Fraud';
    }

    this.save();
    return alert;
  }

  public addInvestigationNote(alertId: string, actionTaken: string, noteText: string, investigatorEmail: string) {
    const alert = this.state.alerts.find((a) => a.alert_id === alertId);
    if (!alert) return null;

    alert.notes_count = (alert.notes_count || 0) + 1;
    alert.updated_at = new Date().toISOString();

    const note: InvestigationNote = {
      id: `NOTE${1000 + this.state.investigationNotes.length + 1}`,
      alert_id: alertId,
      investigator_email: investigatorEmail,
      action_taken: actionTaken.trim() || 'General Audit Note',
      notes: noteText.trim(),
      logged_at: new Date().toISOString(),
    };
    this.state.investigationNotes.push(note);
    this.save();
    return note;
  }

  // --- Configuration ---
  public getFraudConfig(): FraudEngineConfig {
    return this.state.fraudConfig;
  }

  public updateFraudConfig(config: FraudEngineConfig) {
    this.state.fraudConfig = { ...config };
    // Re-score existing transactions with new parameters
    this.reAnalyzeAllTransactions();
    this.save();
    return this.state.fraudConfig;
  }

  public reAnalyzeAllTransactions() {
    const accountMap = new Map<string, Transaction[]>();
    this.state.transactions.forEach((t) => {
      if (!accountMap.has(t.account_id)) accountMap.set(t.account_id, []);
      accountMap.get(t.account_id)!.push(t);
    });

    this.state.transactions.forEach((txn) => {
      const history = accountMap.get(txn.account_id) || [];
      this.state.riskAnalyses[txn.transaction_id] = analyzeTransaction(txn, history, this.state.fraudConfig);
    });

    this.syncWarehouseStarSchema();
  }

  // --- ETL History ---
  public recordUpload(record: DataUploadRecord, metrics: ETLRecordMetrics) {
    this.state.dataUploadHistory.unshift(record);
    this.state.etlProcessingHistory.unshift(metrics);
    this.save();
  }

  public getETLHistory() {
    return {
      uploads: this.state.dataUploadHistory,
      etlMetrics: this.state.etlProcessingHistory,
    };
  }

  // --- Warehouse Star Schema Data & OLAP ---
  public getStarSchemaOverview() {
    return {
      factCount: this.state.factTransactions.length,
      dimDateCount: this.state.dimDate.length,
      dimAccountCount: this.state.dimAccount.length,
      dimLocationCount: this.state.dimLocation.length,
      dimTypeCount: this.state.dimTransactionType.length,
      dimensions: {
        dates: this.state.dimDate.slice(0, 15),
        accounts: this.state.dimAccount.slice(0, 15),
        locations: this.state.dimLocation,
        types: this.state.dimTransactionType,
      },
      sampleFacts: this.state.factTransactions.slice(0, 20),
    };
  }

  // --- Dynamic Dashboard KPI & Stats Calculation ---
  public getDashboardStats() {
    const txns = this.state.transactions;
    const totalTransactions = txns.length;
    let normalCount = 0;
    let suspiciousCount = 0;
    let highRiskCount = 0;
    let totalAmount = 0;

    const riskLevelsMap: Record<RiskLevel, number> = { Low: 0, Medium: 0, High: 0 };
    const dateVolumeMap: Record<string, { date: string; total: number; amount: number; suspicious: number }> = {};
    const typeDistributionMap: Record<string, { type: string; count: number; amount: number }> = {};

    txns.forEach((txn) => {
      const amt = Number(txn.transaction_amount) || 0;
      totalAmount += amt;

      const analysis = this.state.riskAnalyses[txn.transaction_id];
      const riskLevel: RiskLevel = analysis?.risk_level || 'Low';

      riskLevelsMap[riskLevel]++;

      if (riskLevel === 'Low') {
        normalCount++;
      } else if (riskLevel === 'Medium') {
        suspiciousCount++;
      } else if (riskLevel === 'High') {
        highRiskCount++;
        suspiciousCount++; // High risk is also classified under overall suspicious
      }

      // Daily grouping
      const dateKey = txn.transaction_date;
      if (!dateVolumeMap[dateKey]) {
        dateVolumeMap[dateKey] = { date: dateKey, total: 0, amount: 0, suspicious: 0 };
      }
      dateVolumeMap[dateKey].total++;
      dateVolumeMap[dateKey].amount += amt;
      if (riskLevel !== 'Low') {
        dateVolumeMap[dateKey].suspicious++;
      }

      // Type grouping
      const typeKey = txn.transaction_type;
      if (!typeDistributionMap[typeKey]) {
        typeDistributionMap[typeKey] = { type: typeKey, count: 0, amount: 0 };
      }
      typeDistributionMap[typeKey].count++;
      typeDistributionMap[typeKey].amount += amt;
    });

    // Sort daily trends chronologically
    const dailyTrends = Object.values(dateVolumeMap)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14); // Last 14 days

    // Risk distribution pie/donut data
    const riskDistribution = [
      { name: 'Low Risk (Normal)', value: riskLevelsMap.Low, color: '#16a34a' },
      { name: 'Medium Risk (Suspicious)', value: riskLevelsMap.Medium, color: '#f59e0b' },
      { name: 'High Risk (Critical)', value: riskLevelsMap.High, color: '#dc2626' },
    ];

    // Transaction type breakdown
    const typeAnalysis = Object.values(typeDistributionMap).map((item) => ({
      ...item,
      amount: Math.round(item.amount),
    }));

    // Recent 10 transactions with risk metadata
    const recentTransactions = txns.slice(0, 10).map((t) => ({
      ...t,
      analysis: this.state.riskAnalyses[t.transaction_id] || { risk_score: 10, risk_level: 'Low', reasons: [] },
    }));

    // Recent 5 active alerts
    const recentAlerts = this.state.alerts.slice(0, 5).map((a) => {
      const txn = txns.find((t) => t.transaction_id === a.transaction_id);
      return {
        ...a,
        transaction: txn || null,
        analysis: this.state.riskAnalyses[a.transaction_id] || null,
      };
    });

    return {
      kpis: {
        totalTransactions,
        normalTransactions: normalCount,
        suspiciousTransactions: suspiciousCount,
        highRiskTransactions: highRiskCount,
        totalTransactionAmount: totalAmount,
      },
      charts: {
        dailyTrends,
        riskDistribution,
        typeAnalysis,
      },
      recentTransactions,
      recentAlerts,
    };
  }
}

export const db = new DatabaseManager();
