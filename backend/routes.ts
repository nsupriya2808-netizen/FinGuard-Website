import express from 'express';
import type { Request, Response } from 'express';
import { db, getConfiguredCredentials } from './db.ts';
import { hashPassword, verifyPassword, generateAuthToken, verifyAuthToken } from './auth.ts';
import { parseCSVData, cleanCSVRecords } from './etlEngine.ts';
import type { RawCSVRow } from './etlEngine.ts';
import type { FraudEngineConfig, RiskLevel, TransactionType, InvestigationStatus } from './types.ts';

export const apiRouter = express.Router();

// Middleware to extract authenticated user from Bearer token
function authMiddleware(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const userPayload = verifyAuthToken(token);
    if (userPayload) {
      (req as any).user = userPayload;
    }
  }
  next();
}

apiRouter.use(authMiddleware);

// ============================================================================
// 1. AUTHENTICATION & USER PROFILE
// ============================================================================

apiRouter.post('/auth/register', (req: Request, res: Response): void => {
  const { fullName, email, password, confirmPassword, role } = req.body;

  if (!fullName || !email || !password) {
    res.status(400).json({ error: 'Full name, email, and password are required.' });
    return;
  }

  if (password !== confirmPassword) {
    res.status(400).json({ error: 'Passwords do not match.' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    return;
  }

  const existing = db.findUserByEmail(email);
  if (existing) {
    res.status(409).json({ error: 'A user with this email address already exists.' });
    return;
  }

  const assignedRole = role === 'admin' ? 'admin' : role === 'user' ? 'user' : 'analyst';
  const hash = hashPassword(password);
  const newUser = db.createUser(fullName, email, hash, assignedRole);
  const token = generateAuthToken(newUser);

  db.addAuditLog(newUser.email, 'USER_REGISTERED', `New account created with role: ${assignedRole}`);

  res.status(201).json({
    message: 'Registration successful',
    token,
    user: {
      id: newUser.id,
      fullName: newUser.fullName,
      email: newUser.email,
      role: newUser.role,
    },
  });
});

// Endpoint providing sanitized system demo accounts for quick evaluation
apiRouter.get('/auth/demo-credentials', (_req: Request, res: Response): void => {
  const creds = getConfiguredCredentials();
  res.json({
    admin: {
      email: creds.admin.email,
      password: creds.admin.password,
      role: creds.admin.role,
      label: creds.admin.fullName,
    },
    analyst: {
      email: creds.analyst.email,
      password: creds.analyst.password,
      role: creds.analyst.role,
      label: creds.analyst.fullName,
    },
    user: {
      email: creds.user.email,
      password: creds.user.password,
      role: creds.user.role,
      label: creds.user.fullName,
    },
  });
});

apiRouter.post('/auth/login', (req: Request, res: Response): void => {
  const { email, password, portal } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const cleanEmail = String(email).toLowerCase().trim();
  const rawPassword = typeof password === 'string' ? password : String(password);
  console.log(`[Auth] Inbound login attempt for email="${cleanEmail}", portal="${portal || 'standard'}"`);

  // Ensure system accounts are synced with current environment variables
  db.syncSystemAccounts();

  const user = db.findUserByEmail(cleanEmail);
  if (!user) {
    console.warn(`[Auth] Login rejected: Account not found for email="${cleanEmail}"`);
    db.addAuditLog(cleanEmail || 'UNKNOWN', 'LOGIN_FAILED', 'Account not found in system repository', 'WARNING');
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  // Check password against stored PBKDF2 hash
  let isPasswordValid = verifyPassword(rawPassword, user.passwordHash) || verifyPassword(rawPassword.trim(), user.passwordHash);

  // If password check failed against stored hash, test against configured and default credentials
  if (!isPasswordValid) {
    const creds = getConfiguredCredentials();
    if (user.email === creds.admin.email) {
      if (rawPassword === creds.admin.password || rawPassword.trim() === creds.admin.password || rawPassword === 'Admin@FinGuard2026') {
        isPasswordValid = true;
        user.passwordHash = hashPassword(rawPassword.trim());
        db.save();
        console.log(`[Auth] Synchronized administrator password hash for ${user.email}`);
      }
    } else if (user.email === creds.analyst.email) {
      if (rawPassword === creds.analyst.password || rawPassword.trim() === creds.analyst.password || rawPassword === 'FinGuard@2026') {
        isPasswordValid = true;
        user.passwordHash = hashPassword(rawPassword.trim());
        db.save();
        console.log(`[Auth] Synchronized analyst password hash for ${user.email}`);
      }
    } else if (user.email === creds.user.email) {
      if (rawPassword === creds.user.password || rawPassword.trim() === creds.user.password || rawPassword === 'User@FinGuard2026') {
        isPasswordValid = true;
        user.passwordHash = hashPassword(rawPassword.trim());
        db.save();
        console.log(`[Auth] Synchronized user password hash for ${user.email}`);
      }
    }
  }

  if (!isPasswordValid) {
    console.warn(`[Auth] Login rejected: Password verification failed for email="${cleanEmail}"`);
    db.addAuditLog(user.email, 'LOGIN_FAILED', 'Failed login attempt with invalid credentials', 'WARNING');
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  // Validate portal access if portal was specified
  if (portal === 'admin' && user.role !== 'admin') {
    console.warn(`[Auth] Access Denied: User "${user.email}" (${user.role}) attempted login on Admin Portal`);
    db.addAuditLog(user.email, 'ADMIN_ACCESS_BLOCKED', 'Non-admin user attempted login via Administrator portal', 'WARNING');
    res.status(403).json({
      error: `Access Denied: Account "${user.email}" possesses ${user.role.toUpperCase()} privileges. Please switch to the Analyst / User sign-in portal.`,
    });
    return;
  }

  user.lastLogin = new Date().toISOString();
  db.save();

  db.addAuditLog(user.email, 'USER_LOGIN', `User authenticated into ${portal || 'standard'} portal as ${user.role}`);
  console.log(`[Auth] Login successful: "${user.email}" authenticated as role="${user.role}"`);

  const token = generateAuthToken(user);
  res.json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      lastLogin: user.lastLogin,
    },
  });
});

apiRouter.get('/auth/me', (req: Request, res: Response): void => {
  const userPayload = (req as any).user;
  if (!userPayload) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const user = db.findUserByEmail(userPayload.email);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      lastLogin: user.lastLogin,
    },
  });
});

apiRouter.put('/auth/profile', (req: Request, res: Response): void => {
  const { userId, fullName, email } = req.body;
  if (!userId || !fullName || !email) {
    res.status(400).json({ error: 'Missing required profile fields.' });
    return;
  }
  const ok = db.updateUserProfile(userId, fullName, email);
  if (ok) {
    res.json({ message: 'Profile updated successfully.' });
  } else {
    res.status(404).json({ error: 'User not found.' });
  }
});

apiRouter.put('/auth/password', (req: Request, res: Response): void => {
  const { userId, currentPassword, newPassword } = req.body;
  const user = db.findUserByEmail('analyst@finguard.bank'); // fallback or search by ID
  if (!user || !verifyPassword(currentPassword, user.passwordHash)) {
    res.status(400).json({ error: 'Current password incorrect.' });
    return;
  }
  db.updateUserPassword(user.id, hashPassword(newPassword));
  res.json({ message: 'Password changed successfully.' });
});

// ============================================================================
// 2. DASHBOARD APIS
// ============================================================================

apiRouter.get('/dashboard/stats', (_req: Request, res: Response): void => {
  const stats = db.getDashboardStats();
  res.json(stats);
});

// ============================================================================
// 3. TRANSACTIONS APIS
// ============================================================================

apiRouter.get('/transactions', (req: Request, res: Response): void => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 15;
  const search = ((req.query.search as string) || '').toLowerCase().trim();
  const riskLevel = req.query.riskLevel as RiskLevel | 'all';
  const transactionType = req.query.type as TransactionType | 'all';
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;

  let txns = db.getAllTransactions();

  // Search filter
  if (search) {
    txns = txns.filter(
      (t) =>
        t.transaction_id.toLowerCase().includes(search) ||
        t.account_id.toLowerCase().includes(search) ||
        t.location.toLowerCase().includes(search) ||
        t.transaction_type.toLowerCase().includes(search)
    );
  }

  // Type filter
  if (transactionType && transactionType !== 'all') {
    txns = txns.filter((t) => t.transaction_type === transactionType);
  }

  // Date range filter
  if (startDate) {
    txns = txns.filter((t) => t.transaction_date >= startDate);
  }
  if (endDate) {
    txns = txns.filter((t) => t.transaction_date <= endDate);
  }

  // Risk Level filter
  if (riskLevel && riskLevel !== 'all') {
    const riskMap = (db as any).state.riskAnalyses;
    txns = txns.filter((t) => {
      const a = riskMap[t.transaction_id];
      return a && a.risk_level === riskLevel;
    });
  }

  const total = txns.length;
  const startIndex = (page - 1) * limit;
  const paginated = txns.slice(startIndex, startIndex + limit);

  // Attach risk analysis
  const riskMap = (db as any).state.riskAnalyses;
  const results = paginated.map((t) => ({
    ...t,
    analysis: riskMap[t.transaction_id] || { risk_score: 10, risk_level: 'Low', reasons: [] },
  }));

  res.json({
    data: results,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});

apiRouter.get('/transactions/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const details = db.getTransactionById(id);
  if (!details) {
    res.status(404).json({ error: 'Transaction not found' });
    return;
  }
  res.json(details);
});

apiRouter.post('/transactions', (req: Request, res: Response): void => {
  const { account_id, transaction_amount, location, transaction_type, transaction_date, transaction_time } = req.body;
  if (!account_id || !transaction_amount || !location || !transaction_type) {
    res.status(400).json({ error: 'Missing required transaction fields.' });
    return;
  }

  const id = `TXN${Date.now().toString().slice(-6)}`;
  const newTxn = {
    transaction_id: id,
    account_id: account_id.trim(),
    transaction_amount: Number(parseFloat(transaction_amount).toFixed(2)),
    transaction_date: transaction_date || new Date().toISOString().split('T')[0],
    transaction_time: transaction_time || new Date().toTimeString().split(' ')[0],
    location: location.trim(),
    transaction_type: transaction_type as TransactionType,
    created_at: new Date().toISOString(),
  };

  db.insertCleanedTransactions([newTxn], 'MANUAL_ENTRY');
  const details = db.getTransactionById(id);
  res.status(201).json(details);
});

// ============================================================================
// 4. MODULE 1 – ETL & DATA MANAGEMENT
// ============================================================================

apiRouter.post('/etl/parse-csv', (req: Request, res: Response): void => {
  const { csvContent, filename } = req.body;
  if (!csvContent || typeof csvContent !== 'string') {
    res.status(400).json({ error: 'CSV text content is required.' });
    return;
  }

  const { headers, rows, totalRows } = parseCSVData(csvContent);
  const preview = rows.slice(0, 10);

  res.json({
    filename: filename || 'uploaded_data.csv',
    totalRows,
    columnCount: headers.length,
    headers,
    preview,
  });
});

apiRouter.post('/etl/clean', (req: Request, res: Response): void => {
  const { rows } = req.body;
  if (!rows || !Array.isArray(rows)) {
    res.status(400).json({ error: 'Rows array required.' });
    return;
  }

  const existingIds = new Set(db.getAllTransactions().map((t) => t.transaction_id));
  const cleaningResult = cleanCSVRecords(rows as RawCSVRow[], existingIds);

  res.json(cleaningResult);
});

apiRouter.post('/etl/transform-and-load', (req: Request, res: Response): void => {
  const { cleanTransactions, filename, missingCount, duplicateCount, invalidAmountCount, invalidDateCount } = req.body;

  if (!cleanTransactions || !Array.isArray(cleanTransactions) || cleanTransactions.length === 0) {
    res.status(400).json({ error: 'No clean transactions provided for database insertion.' });
    return;
  }

  const uploadId = `UPL${Date.now().toString().slice(-5)}`;
  const startTime = Date.now();

  // Insert into operational database and sync Star Schema
  db.insertCleanedTransactions(cleanTransactions, uploadId);

  const duration = Date.now() - startTime;

  // Record ETL History
  db.recordUpload(
    {
      upload_id: uploadId,
      filename: filename || 'manual_upload.csv',
      uploaded_by: 'analyst@finguard.bank',
      total_rows: cleanTransactions.length + (missingCount || 0) + (duplicateCount || 0) + (invalidAmountCount || 0),
      valid_rows: cleanTransactions.length,
      rejected_rows: (missingCount || 0) + (duplicateCount || 0) + (invalidAmountCount || 0) + (invalidDateCount || 0),
      status: 'loaded',
      upload_time: new Date().toISOString(),
    },
    {
      upload_id: uploadId,
      missing_values_count: missingCount || 0,
      duplicate_records_count: duplicateCount || 0,
      invalid_amounts_count: invalidAmountCount || 0,
      invalid_dates_count: invalidDateCount || 0,
      cleaned_records_count: cleanTransactions.length,
      processing_duration_ms: duration,
      executed_at: new Date().toISOString(),
    }
  );

  res.json({
    success: true,
    uploadId,
    insertedCount: cleanTransactions.length,
    durationMs: duration,
    warehouseFactsCount: (db as any).state.factTransactions.length,
  });
});

apiRouter.get('/etl/history', (_req: Request, res: Response): void => {
  res.json(db.getETLHistory());
});

apiRouter.get('/etl/aggregations', (_req: Request, res: Response): void => {
  const txns = db.getAllTransactions();
  const byDate: Record<string, { count: number; amount: number }> = {};
  const byAccount: Record<string, { count: number; amount: number }> = {};
  const byType: Record<string, { count: number; amount: number }> = {};
  const byLocation: Record<string, { count: number; amount: number }> = {};

  txns.forEach((t) => {
    const amt = Number(t.transaction_amount) || 0;
    // Date
    if (!byDate[t.transaction_date]) byDate[t.transaction_date] = { count: 0, amount: 0 };
    byDate[t.transaction_date].count++;
    byDate[t.transaction_date].amount += amt;

    // Account
    if (!byAccount[t.account_id]) byAccount[t.account_id] = { count: 0, amount: 0 };
    byAccount[t.account_id].count++;
    byAccount[t.account_id].amount += amt;

    // Type
    if (!byType[t.transaction_type]) byType[t.transaction_type] = { count: 0, amount: 0 };
    byType[t.transaction_type].count++;
    byType[t.transaction_type].amount += amt;

    // Location
    if (!byLocation[t.location]) byLocation[t.location] = { count: 0, amount: 0 };
    byLocation[t.location].count++;
    byLocation[t.location].amount += amt;
  });

  const topLocations = Object.entries(byLocation)
    .map(([location, data]) => ({ location, ...data }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);

  const topAccounts = Object.entries(byAccount)
    .map(([account, data]) => ({ account, ...data }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);

  res.json({
    byDate: Object.entries(byDate).map(([date, d]) => ({ date, ...d })),
    byType: Object.entries(byType).map(([type, d]) => ({ type, ...d })),
    topLocations,
    topAccounts,
  });
});

// ============================================================================
// 5. MODULE 2 – FRAUD DETECTION & RISK ANALYSIS
// ============================================================================

apiRouter.get('/fraud/config', (_req: Request, res: Response): void => {
  res.json(db.getFraudConfig());
});

apiRouter.put('/fraud/config', (req: Request, res: Response): void => {
  const newConfig = req.body as FraudEngineConfig;
  const updated = db.updateFraudConfig(newConfig);
  res.json({ message: 'Fraud configuration and risk weights updated', config: updated });
});

apiRouter.post('/fraud/analyze-batch', (_req: Request, res: Response): void => {
  const start = Date.now();
  db.reAnalyzeAllTransactions();
  const txns = db.getAllTransactions();
  const riskMap = (db as any).state.riskAnalyses;

  let amountAnomalies = 0;
  let locationAnomalies = 0;
  let timeAnomalies = 0;
  let burstAnomalies = 0;
  let typeAnomalies = 0;

  txns.forEach((t) => {
    const a = riskMap[t.transaction_id];
    if (a) {
      if (a.anomaly_amount_flag) amountAnomalies++;
      if (a.anomaly_location_flag) locationAnomalies++;
      if (a.anomaly_time_flag) timeAnomalies++;
      if (a.anomaly_frequency_flag) burstAnomalies++;
      if (a.anomaly_type_flag) typeAnomalies++;
    }
  });

  res.json({
    analyzedCount: txns.length,
    durationMs: Date.now() - start,
    anomaliesDetected: {
      amountAnomalies,
      locationAnomalies,
      timeAnomalies,
      burstAnomalies,
      typeAnomalies,
    },
  });
});

// ============================================================================
// 6. SUSPICIOUS ALERTS & INVESTIGATION
// ============================================================================

apiRouter.get('/alerts', (req: Request, res: Response): void => {
  const status = req.query.status as InvestigationStatus | 'all';
  let alerts = db.getAlerts();

  if (status && status !== 'all') {
    alerts = alerts.filter((a) => a.investigation_status === status);
  }

  res.json(alerts);
});

apiRouter.patch('/alerts/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const { status, noteText } = req.body;

  if (!status) {
    res.status(400).json({ error: 'Status is required.' });
    return;
  }

  const updated = db.updateAlertStatus(id, status as InvestigationStatus, noteText);
  if (!updated) {
    res.status(404).json({ error: 'Alert not found.' });
    return;
  }
  res.json({ message: 'Alert investigation status updated', alert: updated });
});

apiRouter.post('/alerts/:id/notes', (req: Request, res: Response): void => {
  const { id } = req.params;
  const { actionTaken, notes } = req.body;

  if (!notes) {
    res.status(400).json({ error: 'Notes text required.' });
    return;
  }

  const note = db.addInvestigationNote(id, actionTaken || 'Audit Observation', notes, 'analyst@finguard.bank');
  if (!note) {
    res.status(404).json({ error: 'Alert not found.' });
    return;
  }
  res.status(201).json(note);
});

// ============================================================================
// 7. DATA WAREHOUSE & STAR SCHEMA APIS
// ============================================================================

apiRouter.get('/warehouse/star-schema', (_req: Request, res: Response): void => {
  res.json(db.getStarSchemaOverview());
});

apiRouter.post('/warehouse/olap-query', (req: Request, res: Response): void => {
  const { dimension } = req.body; // 'date' | 'account_segment' | 'location' | 'type'
  const facts = (db as any).state.factTransactions;
  const dims = (db as any).state;

  if (dimension === 'location') {
    const locMap = new Map<number, string>();
    dims.dimLocation.forEach((l: any) => locMap.set(l.location_key, l.city_name));
    const grouped: Record<string, { totalAmount: number; count: number; highRiskCount: number }> = {};
    facts.forEach((f: any) => {
      const loc = locMap.get(f.location_key) || 'Unknown';
      if (!grouped[loc]) grouped[loc] = { totalAmount: 0, count: 0, highRiskCount: 0 };
      grouped[loc].totalAmount += f.amount;
      grouped[loc].count++;
      if (f.risk_level === 'High') grouped[loc].highRiskCount++;
    });
    res.json(Object.entries(grouped).map(([key, v]) => ({ dimensionValue: key, ...v })));
    return;
  }

  if (dimension === 'type') {
    const typeMap = new Map<number, string>();
    dims.dimTransactionType.forEach((t: any) => typeMap.set(t.type_key, t.type_name));
    const grouped: Record<string, { totalAmount: number; count: number; highRiskCount: number }> = {};
    facts.forEach((f: any) => {
      const tName = typeMap.get(f.type_key) || 'Unknown';
      if (!grouped[tName]) grouped[tName] = { totalAmount: 0, count: 0, highRiskCount: 0 };
      grouped[tName].totalAmount += f.amount;
      grouped[tName].count++;
      if (f.risk_level === 'High') grouped[tName].highRiskCount++;
    });
    res.json(Object.entries(grouped).map(([key, v]) => ({ dimensionValue: key, ...v })));
    return;
  }

  // Default: date dimension
  const dateMap = new Map<number, string>();
  dims.dimDate.forEach((d: any) => dateMap.set(d.date_key, d.full_date));
  const grouped: Record<string, { totalAmount: number; count: number; highRiskCount: number }> = {};
  facts.forEach((f: any) => {
    const dt = dateMap.get(f.date_key) || 'Unknown';
    if (!grouped[dt]) grouped[dt] = { totalAmount: 0, count: 0, highRiskCount: 0 };
    grouped[dt].totalAmount += f.amount;
    grouped[dt].count++;
    if (f.risk_level === 'High') grouped[dt].highRiskCount++;
  });
  res.json(
    Object.entries(grouped)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-10)
      .map(([key, v]) => ({ dimensionValue: key, ...v }))
  );
});

// ============================================================================
// 8. REPORTS & ANALYTICS
// ============================================================================

apiRouter.get('/reports/summary', (req: Request, res: Response): void => {
  const txns = db.getAllTransactions();
  const riskMap = (db as any).state.riskAnalyses;

  const total = txns.length;
  const suspicious = txns.filter((t) => riskMap[t.transaction_id]?.risk_level !== 'Low');
  const highRisk = txns.filter((t) => riskMap[t.transaction_id]?.risk_level === 'High');

  // Daily grouping
  const dailyMap: Record<string, { date: string; count: number; amount: number; suspicious: number }> = {};
  txns.forEach((t) => {
    if (!dailyMap[t.transaction_date]) {
      dailyMap[t.transaction_date] = { date: t.transaction_date, count: 0, amount: 0, suspicious: 0 };
    }
    dailyMap[t.transaction_date].count++;
    dailyMap[t.transaction_date].amount += Number(t.transaction_amount);
    if (riskMap[t.transaction_id]?.risk_level !== 'Low') {
      dailyMap[t.transaction_date].suspicious++;
    }
  });

  // Monthly grouping
  const monthlyMap: Record<string, { month: string; count: number; amount: number; highRisk: number }> = {};
  txns.forEach((t) => {
    const m = t.transaction_date.substring(0, 7);
    if (!monthlyMap[m]) {
      monthlyMap[m] = { month: m, count: 0, amount: 0, highRisk: 0 };
    }
    monthlyMap[m].count++;
    monthlyMap[m].amount += Number(t.transaction_amount);
    if (riskMap[t.transaction_id]?.risk_level === 'High') {
      monthlyMap[m].highRisk++;
    }
  });

  res.json({
    totalTransactionsCount: total,
    suspiciousTransactionsCount: suspicious.length,
    highRiskTransactionsCount: highRisk.length,
    totalVolume: txns.reduce((s, t) => s + Number(t.transaction_amount), 0),
    dailyReport: Object.values(dailyMap).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 15),
    monthlyReport: Object.values(monthlyMap).sort((a, b) => b.month.localeCompare(a.month)),
    highRiskSample: highRisk.slice(0, 10).map((t) => ({ ...t, analysis: riskMap[t.transaction_id] })),
  });
});

apiRouter.get('/reports/export-csv', (req: Request, res: Response): void => {
  const reportType = req.query.type as string; // 'all' | 'suspicious' | 'high_risk'
  let txns = db.getAllTransactions();
  const riskMap = (db as any).state.riskAnalyses;

  if (reportType === 'suspicious') {
    txns = txns.filter((t) => riskMap[t.transaction_id]?.risk_level !== 'Low');
  } else if (reportType === 'high_risk') {
    txns = txns.filter((t) => riskMap[t.transaction_id]?.risk_level === 'High');
  }

  const header = 'Transaction_ID,Account_ID,Transaction_Amount,Transaction_Date,Transaction_Time,Location,Transaction_Type,Risk_Score,Risk_Level\n';
  const rows = txns.map((t) => {
    const a = riskMap[t.transaction_id] || { risk_score: 0, risk_level: 'Low' };
    return `${t.transaction_id},${t.account_id},${t.transaction_amount},${t.transaction_date},${t.transaction_time},"${t.location}",${t.transaction_type},${a.risk_score},${a.risk_level}`;
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=finguard_report_${reportType || 'all'}.csv`);
  res.send(header + rows.join('\n'));
});

// ============================================================================
// 9. SYSTEM RESET & SAMPLE DOWNLOAD
// ============================================================================

apiRouter.post('/system/reset-demo', (_req: Request, res: Response): void => {
  db.seedInitialData();
  res.json({ message: 'Database reset to initial 520+ synthetic demonstration transactions successfully.' });
});

// ============================================================================
// 10. ADMIN CONSOLE & USER MANAGEMENT
// ============================================================================

apiRouter.get('/admin/users', (_req: Request, res: Response): void => {
  res.json(db.getAllUsers());
});

apiRouter.post('/admin/users', (req: Request, res: Response): void => {
  const { fullName, email, password, role } = req.body;
  if (!fullName || !email || !password) {
    res.status(400).json({ error: 'Full name, email, and password required.' });
    return;
  }
  const existing = db.findUserByEmail(email);
  if (existing) {
    res.status(409).json({ error: 'A user with this email already exists.' });
    return;
  }
  const newUser = db.createUser(fullName, email, hashPassword(password), role || 'analyst');
  db.addAuditLog('admin@finguard.bank', 'USER_CREATED_BY_ADMIN', `Created new user ${email} with role: ${role || 'analyst'}`);
  res.status(201).json(newUser);
});

apiRouter.patch('/admin/users/:id/role', (req: Request, res: Response): void => {
  const { id } = req.params;
  const { role } = req.body;
  if (!role) {
    res.status(400).json({ error: 'Role is required.' });
    return;
  }
  const ok = db.updateUserRole(id, role);
  if (!ok) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }
  db.addAuditLog('admin@finguard.bank', 'ROLE_MODIFIED', `Updated user ${id} role to ${role}`);
  res.json({ message: 'User role updated successfully' });
});

apiRouter.delete('/admin/users/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const ok = db.deleteUser(id);
  if (!ok) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }
  db.addAuditLog('admin@finguard.bank', 'USER_DELETED', `Deleted user ${id}`);
  res.json({ message: 'User removed successfully' });
});

apiRouter.get('/admin/audit-logs', (_req: Request, res: Response): void => {
  res.json(db.getAuditLogs());
});
