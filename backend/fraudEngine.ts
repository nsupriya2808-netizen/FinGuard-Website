import type { Transaction, RiskAnalysis, RiskFactor, RiskLevel, FraudEngineConfig } from './types.ts';

export const DEFAULT_FRAUD_CONFIG: FraudEngineConfig = {
  highAmountThreshold: 5000,
  veryHighAmountThreshold: 10000,
  nightHourStart: 1, // 01:00 AM
  nightHourEnd: 5,   // 05:00 AM
  burstWindowMinutes: 5,
  burstMaxTransactions: 3,
  weights: {
    amountWeight: 35,
    timeWeight: 20,
    locationWeight: 20,
    frequencyWeight: 15,
    typeWeight: 10,
  },
};

// High risk foreign or offshore jurisdiction locations
const HIGH_RISK_LOCATIONS = new Set([
  'Moscow', 'Lagos', 'Kyiv', 'Dubai', 'Zurich', 'Cayman Islands', 'Panama City'
]);

// Normal domestic locations
const KNOWN_DOMESTIC_LOCATIONS = new Set([
  'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia',
  'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville',
  'San Francisco', 'Columbus', 'Indianapolis', 'Seattle', 'Denver', 'Boston', 'Atlanta'
]);

/**
 * Calculates risk score and anomaly flags for a transaction based on statistical thresholds,
 * time window anomalies, geographic risk, and account history.
 */
export function analyzeTransaction(
  txn: Transaction,
  accountHistory: Transaction[],
  config: FraudEngineConfig = DEFAULT_FRAUD_CONFIG
): RiskAnalysis {
  const reasons: RiskFactor[] = [];
  let score = 0;

  let anomaly_amount_flag = false;
  let anomaly_location_flag = false;
  let anomaly_time_flag = false;
  let anomaly_frequency_flag = false;
  let anomaly_type_flag = false;

  const amount = Number(txn.transaction_amount);

  // 1. ANOMALY DETECTION: Transaction Amount
  if (amount >= config.veryHighAmountThreshold) {
    anomaly_amount_flag = true;
    score += config.weights.amountWeight;
    reasons.push({
      factor: 'Critical Transaction Volume',
      points: config.weights.amountWeight,
      description: `Amount ($${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}) exceeds extreme threshold ($${config.veryHighAmountThreshold.toLocaleString()})`,
      severity: 'critical',
    });
  } else if (amount >= config.highAmountThreshold) {
    anomaly_amount_flag = true;
    const partialScore = Math.round(config.weights.amountWeight * 0.7);
    score += partialScore;
    reasons.push({
      factor: 'Elevated Transaction Amount',
      points: partialScore,
      description: `Amount ($${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}) exceeds standard threshold ($${config.highAmountThreshold.toLocaleString()})`,
      severity: 'warning',
    });
  } else if (accountHistory.length >= 3) {
    // Check against account average spending
    const pastAmounts = accountHistory
      .filter((t) => t.transaction_id !== txn.transaction_id)
      .map((t) => Number(t.transaction_amount));
    if (pastAmounts.length > 0) {
      const avg = pastAmounts.reduce((a, b) => a + b, 0) / pastAmounts.length;
      if (amount > avg * 4 && amount > 1500) {
        anomaly_amount_flag = true;
        const accountDeviationScore = Math.min(25, Math.round(config.weights.amountWeight * 0.5));
        score += accountDeviationScore;
        reasons.push({
          factor: 'Account Spending Anomaly',
          points: accountDeviationScore,
          description: `Transaction amount is >4x the account average spending ($${avg.toFixed(2)})`,
          severity: 'warning',
        });
      }
    }
  }

  // 2. ANOMALY DETECTION: Transaction Time (Unusual Hours)
  let hour = 12;
  if (txn.transaction_time) {
    const parts = txn.transaction_time.split(':');
    hour = parseInt(parts[0], 10) || 0;
  }
  if (hour >= config.nightHourStart && hour <= config.nightHourEnd) {
    anomaly_time_flag = true;
    score += config.weights.timeWeight;
    reasons.push({
      factor: 'Unusual Nocturnal Activity',
      points: config.weights.timeWeight,
      description: `Transaction initiated at ${txn.transaction_time} within high-risk nocturnal window (0${config.nightHourStart}:00–0${config.nightHourEnd}:00)`,
      severity: 'warning',
    });
  }

  // 3. ANOMALY DETECTION: Location Anomaly & Velocity
  const trimmedLocation = (txn.location || '').trim();
  if (HIGH_RISK_LOCATIONS.has(trimmedLocation)) {
    anomaly_location_flag = true;
    score += config.weights.locationWeight;
    reasons.push({
      factor: 'High-Risk International Jurisdiction',
      points: config.weights.locationWeight,
      description: `Transaction originating from flagged foreign jurisdiction (${trimmedLocation})`,
      severity: 'critical',
    });
  } else if (!KNOWN_DOMESTIC_LOCATIONS.has(trimmedLocation)) {
    // Unfamiliar location
    const unfamiliarScore = Math.round(config.weights.locationWeight * 0.5);
    anomaly_location_flag = true;
    score += unfamiliarScore;
    reasons.push({
      factor: 'Unfamiliar Geographic Location',
      points: unfamiliarScore,
      description: `Transaction processed in unverified merchant hub (${trimmedLocation})`,
      severity: 'info',
    });
  }

  // 4. ANOMALY DETECTION: Repeated Rapid Transactions (Burst Frequency / Velocity)
  if (accountHistory.length > 0) {
    const txnTimestamp = new Date(`${txn.transaction_date}T${txn.transaction_time || '00:00:00'}`).getTime();
    if (!isNaN(txnTimestamp)) {
      const windowMs = config.burstWindowMinutes * 60 * 1000;
      const recentTransactions = accountHistory.filter((other) => {
        if (other.transaction_id === txn.transaction_id) return false;
        const otherTs = new Date(`${other.transaction_date}T${other.transaction_time || '00:00:00'}`).getTime();
        return Math.abs(txnTimestamp - otherTs) <= windowMs;
      });

      if (recentTransactions.length >= config.burstMaxTransactions - 1) {
        anomaly_frequency_flag = true;
        score += config.weights.frequencyWeight;
        reasons.push({
          factor: 'High-Velocity Transaction Burst',
          points: config.weights.frequencyWeight,
          description: `${recentTransactions.length + 1} transactions executed within a ${config.burstWindowMinutes}-minute window`,
          severity: 'critical',
        });
      }
    }
  }

  // 5. ANOMALY DETECTION: High Risk Transaction Type (Wire Transfer + High Value)
  if (txn.transaction_type === 'Wire Transfer') {
    if (amount > 3000) {
      anomaly_type_flag = true;
      score += config.weights.typeWeight;
      reasons.push({
        factor: 'Irreversible High-Value Channel',
        points: config.weights.typeWeight,
        description: 'Large amount executed via non-repudiable Wire Transfer',
        severity: 'warning',
      });
    }
  } else if (txn.transaction_type === 'ATM' && amount > 1000) {
    anomaly_type_flag = true;
    const atmScore = Math.round(config.weights.typeWeight * 0.6);
    score += atmScore;
    reasons.push({
      factor: 'Elevated ATM Cash Withdrawal',
      points: atmScore,
      description: `ATM cash withdrawal ($${amount}) approaches maximum automated daily dispense limit`,
      severity: 'info',
    });
  }

  // Cap score between 0 and 100
  score = Math.min(100, Math.max(0, score));

  // Risk Classification
  let risk_level: RiskLevel = 'Low';
  if (score >= 61) {
    risk_level = 'High';
  } else if (score >= 31) {
    risk_level = 'Medium';
  }

  if (reasons.length === 0) {
    reasons.push({
      factor: 'Nominal Baseline Profile',
      points: 0,
      description: 'Transaction parameters align with verified account and standard merchant patterns',
      severity: 'info',
    });
  }

  return {
    transaction_id: txn.transaction_id,
    risk_score: score,
    risk_level,
    anomaly_amount_flag,
    anomaly_location_flag,
    anomaly_time_flag,
    anomaly_frequency_flag,
    anomaly_type_flag,
    reasons,
    model_version: 'v1.4-statistical-ensemble',
    analyzed_at: new Date().toISOString(),
  };
}
