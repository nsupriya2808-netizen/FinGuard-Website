import Papa from 'papaparse';
import type { Transaction, TransactionType } from './types.ts';

export interface RawCSVRow {
  Transaction_ID?: string;
  Account_ID?: string;
  Transaction_Amount?: string | number;
  Transaction_Date?: string;
  Transaction_Time?: string;
  Location?: string;
  Transaction_Type?: string;
  [key: string]: any;
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
  validRows: RawCSVRow[];
  cleanTransactions: Transaction[];
}

export interface TransformationResult {
  transformedRecords: Transaction[];
  transformationsApplied: {
    datesStandardized: number;
    amountsFormatted: number;
    locationsStandardized: number;
    typesNormalized: number;
  };
}

const VALID_TYPES: Record<string, TransactionType> = {
  pos: 'POS',
  point_of_sale: 'POS',
  'point of sale': 'POS',
  online: 'Online',
  ecommerce: 'Online',
  web: 'Online',
  atm: 'ATM',
  cash: 'ATM',
  wire: 'Wire Transfer',
  'wire transfer': 'Wire Transfer',
  wire_transfer: 'Wire Transfer',
  mobile: 'Mobile Transfer',
  'mobile transfer': 'Mobile Transfer',
  mobile_transfer: 'Mobile Transfer',
};

/**
 * Parses raw CSV string and returns headers and row preview
 */
export function parseCSVData(csvContent: string): { headers: string[]; rows: RawCSVRow[]; totalRows: number } {
  const parsed = Papa.parse<RawCSVRow>(csvContent.trim(), {
    header: true,
    skipEmptyLines: true,
  });

  const headers = parsed.meta.fields || [];
  return {
    headers,
    rows: parsed.data,
    totalRows: parsed.data.length,
  };
}

/**
 * Standardizes a date string into YYYY-MM-DD
 */
export function standardizeDate(dateStr: string): string | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  // Check ISO format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) return trimmed;
  }
  // Try MM/DD/YYYY or DD/MM/YYYY
  const slashParts = trimmed.split('/');
  if (slashParts.length === 3) {
    let [m, d, y] = slashParts;
    if (y.length === 2) y = '20' + y;
    if (y.length === 4) {
      const parsedDate = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString().split('T')[0];
      }
    }
  }
  // Standard JS Date parse fallback
  const fallback = new Date(trimmed);
  if (!isNaN(fallback.getTime())) {
    return fallback.toISOString().split('T')[0];
  }
  return null;
}

/**
 * Normalizes location string (title case, trim)
 */
export function standardizeLocation(loc: string): string {
  if (!loc) return 'Unknown';
  return loc
    .trim()
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Standardizes transaction type into canonical ENUM
 */
export function standardizeTransactionType(rawType: string): TransactionType {
  if (!rawType) return 'POS';
  const clean = rawType.trim().toLowerCase();
  return VALID_TYPES[clean] || 'POS';
}

/**
 * Executes comprehensive data cleaning on raw CSV rows
 */
export function cleanCSVRecords(rows: RawCSVRow[], existingTxnIds: Set<string> = new Set()): CleaningResult {
  const issues: CleaningIssue[] = [];
  const seenIdsInBatch = new Set<string>();
  const validRows: RawCSVRow[] = [];
  const cleanTransactions: Transaction[] = [];

  let missingValuesCount = 0;
  let duplicateRecordsCount = 0;
  let invalidAmountsCount = 0;
  let invalidDatesCount = 0;
  let missingAccountsCount = 0;

  rows.forEach((row, index) => {
    const rowNum = index + 2; // Accounting for 1-based index and header row
    const txnId = (row.Transaction_ID || row.transaction_id || '').trim();
    const accId = (row.Account_ID || row.account_id || '').trim();
    const rawAmt = row.Transaction_Amount !== undefined ? row.Transaction_Amount : row.transaction_amount;
    const rawDate = (row.Transaction_Date || row.transaction_date || '').trim();
    const rawTime = (row.Transaction_Time || row.transaction_time || '12:00:00').trim();
    const rawLoc = (row.Location || row.location || '').trim();
    const rawType = (row.Transaction_Type || row.transaction_type || '').trim();

    let rowHasFatalError = false;

    // Check Transaction ID
    if (!txnId) {
      issues.push({
        rowNumber: rowNum,
        field: 'Transaction_ID',
        issueType: 'missing_value',
        rawValue: '',
        message: 'Missing unique Transaction_ID',
      });
      missingValuesCount++;
      rowHasFatalError = true;
    } else if (seenIdsInBatch.has(txnId) || existingTxnIds.has(txnId)) {
      issues.push({
        rowNumber: rowNum,
        transactionId: txnId,
        field: 'Transaction_ID',
        issueType: 'duplicate_record',
        rawValue: txnId,
        message: `Duplicate Transaction ID detected (${txnId})`,
      });
      duplicateRecordsCount++;
      rowHasFatalError = true;
    } else {
      seenIdsInBatch.add(txnId);
    }

    // Check Account ID
    if (!accId) {
      issues.push({
        rowNumber: rowNum,
        transactionId: txnId,
        field: 'Account_ID',
        issueType: 'missing_account',
        rawValue: '',
        message: 'Missing Account_ID for transaction owner',
      });
      missingAccountsCount++;
      rowHasFatalError = true;
    }

    // Check Amount
    const numAmt = typeof rawAmt === 'number' ? rawAmt : parseFloat(String(rawAmt || '').replace(/[$,]/g, ''));
    if (isNaN(numAmt) || numAmt <= 0) {
      issues.push({
        rowNumber: rowNum,
        transactionId: txnId,
        field: 'Transaction_Amount',
        issueType: 'invalid_amount',
        rawValue: String(rawAmt),
        message: `Invalid transaction amount (${rawAmt}). Must be a positive numeric value.`,
      });
      invalidAmountsCount++;
      rowHasFatalError = true;
    }

    // Check Date
    const stdDate = standardizeDate(rawDate);
    if (!stdDate) {
      issues.push({
        rowNumber: rowNum,
        transactionId: txnId,
        field: 'Transaction_Date',
        issueType: 'invalid_date',
        rawValue: rawDate,
        message: `Unparseable or corrupt date format (${rawDate}). Requires YYYY-MM-DD.`,
      });
      invalidDatesCount++;
      rowHasFatalError = true;
    }

    if (!rowHasFatalError) {
      validRows.push(row);
      cleanTransactions.push({
        transaction_id: txnId,
        account_id: accId,
        transaction_amount: Number(numAmt.toFixed(2)),
        transaction_date: stdDate!,
        transaction_time: /^\d{2}:\d{2}(:\d{2})?$/.test(rawTime) ? (rawTime.length === 5 ? rawTime + ':00' : rawTime) : '12:00:00',
        location: standardizeLocation(rawLoc),
        transaction_type: standardizeTransactionType(rawType),
        created_at: new Date().toISOString(),
      });
    }
  });

  return {
    totalRows: rows.length,
    missingValuesCount,
    duplicateRecordsCount,
    invalidAmountsCount,
    invalidDatesCount,
    missingAccountsCount,
    cleanRecordsCount: cleanTransactions.length,
    issues,
    validRows,
    cleanTransactions,
  };
}
