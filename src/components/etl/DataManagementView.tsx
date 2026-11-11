import React, { useState, useEffect } from 'react';
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  Database,
  ArrowRight,
  Download,
  Play,
  RotateCcw,
  Check,
  Layers,
  BarChart2,
} from 'lucide-react';
import { api } from '../../api/client';
import { CleaningResult, Transaction } from '../../types';
import { StatCard } from '../ui/StatCard';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const DataManagementView: React.FC = () => {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);
  const [csvContent, setCsvContent] = useState<string>('');
  const [filename, setFilename] = useState<string>('');
  const [previewData, setPreviewData] = useState<{
    headers: string[];
    rows: any[];
    totalRows: number;
    columnCount: number;
  } | null>(null);

  const [cleaningResult, setCleaningResult] = useState<CleaningResult | null>(null);
  const [cleaningInProgress, setCleaningInProgress] = useState(false);

  const [loadingToDb, setLoadingToDb] = useState(false);
  const [loadResult, setLoadResult] = useState<{
    success: boolean;
    uploadId: string;
    insertedCount: number;
    durationMs: number;
    warehouseFactsCount: number;
  } | null>(null);

  // Aggregation state
  const [aggregations, setAggregations] = useState<{
    byDate: any[];
    byType: any[];
    topLocations: any[];
    topAccounts: any[];
  } | null>(null);

  useEffect(() => {
    api.getETLAggregations().then(setAggregations).catch(console.error);
  }, [loadResult]);

  // Handle file drop / select
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      setCsvContent(text);
      try {
        const parsed = await api.parseCSV(text, file.name);
        setPreviewData({
          headers: parsed.headers,
          rows: parsed.preview,
          totalRows: parsed.totalRows,
          columnCount: parsed.columnCount,
        });
        setActiveStep(1);
        setCleaningResult(null);
        setLoadResult(null);
      } catch (err) {
        alert('Failed to parse uploaded CSV');
      }
    };
    reader.readAsText(file);
  };

  // Quick load of the corrupt sample dataset to showcase cleaning
  const loadCorruptTestSample = async () => {
    try {
      const res = await fetch('/api/dataset/corrupt_sample.csv');
      const text = await res.text();
      setFilename('corrupt_sample_for_etl_test.csv');
      setCsvContent(text);
      const parsed = await api.parseCSV(text, 'corrupt_sample_for_etl_test.csv');
      setPreviewData({
        headers: parsed.headers,
        rows: parsed.preview,
        totalRows: parsed.totalRows,
        columnCount: parsed.columnCount,
      });
      setActiveStep(1);
      setCleaningResult(null);
      setLoadResult(null);
    } catch {
      alert('Failed to load sample test file');
    }
  };

  // Run Step 2: Data Cleaning
  const runDataCleaning = async () => {
    if (!csvContent) return;
    setCleaningInProgress(true);
    try {
      const parsed = await api.parseCSV(csvContent, filename);
      const fullRows = await fetch('/api/etl/parse-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvContent, filename }),
      }).then((r) => r.json());

      // Parse all rows for cleaning
      const result = await api.cleanCSV(parsed.preview.length === parsed.totalRows ? parsed.preview : await parseAllCSVRows(csvContent));
      setCleaningResult(result);
      setActiveStep(2);
    } catch (err: any) {
      alert(err.message || 'Cleaning step failed');
    } finally {
      setCleaningInProgress(false);
    }
  };

  // Helper to parse all rows via client PapaParse
  const parseAllCSVRows = async (content: string) => {
    const Papa = (await import('papaparse')).default;
    const parsed = Papa.parse(content.trim(), { header: true, skipEmptyLines: true });
    return parsed.data;
  };

  // Run Step 3: Transformation & Load into Database
  const runTransformAndLoad = async () => {
    if (!cleaningResult || cleaningResult.cleanTransactions.length === 0) return;
    setLoadingToDb(true);
    try {
      const res = await api.transformAndLoad({
        cleanTransactions: cleaningResult.cleanTransactions,
        filename: filename || 'batch_upload.csv',
        missingCount: cleaningResult.missingValuesCount + cleaningResult.missingAccountsCount,
        duplicateCount: cleaningResult.duplicateRecordsCount,
        invalidAmountCount: cleaningResult.invalidAmountsCount,
        invalidDateCount: cleaningResult.invalidDatesCount,
      });
      setLoadResult(res);
      setActiveStep(3);
    } catch (err: any) {
      alert(err.message || 'Failed to load records into database');
    } finally {
      setLoadingToDb(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Module 1: Transaction Data Management & ETL Pipeline
          </h2>
          <p className="text-xs text-slate-500">
            End-to-end data ingestion, validation cleaning, dimensional transformation, and warehouse storage.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/dataset/sample.csv"
            download="sample_transactions.csv"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Standard Sample CSV</span>
          </a>
          <button
            onClick={loadCorruptTestSample}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-md transition-colors"
          >
            <Play className="w-3.5 h-3.5 text-blue-600" />
            <span>Load Corrupt Test Sample (For Examiners)</span>
          </button>
        </div>
      </div>

      {/* Visual ETL Pipeline Flow Diagram */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Visual ETL Architecture Pipeline
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          {/* Step 1: Data Collection */}
          <div
            className={`p-3 rounded-lg border transition-all ${
              activeStep === 1
                ? 'bg-blue-50/60 border-blue-300 ring-1 ring-blue-500'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between font-semibold text-slate-900 mb-1">
              <span>1. Data Collection</span>
              <Upload className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-[11px] text-slate-500">
              CSV parsing, header validation, encoding checks, and structure preview.
            </p>
          </div>

          {/* Step 2: Data Cleaning */}
          <div
            className={`p-3 rounded-lg border transition-all ${
              activeStep === 2
                ? 'bg-blue-50/60 border-blue-300 ring-1 ring-blue-500'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between font-semibold text-slate-900 mb-1">
              <span>2. Data Cleaning</span>
              <AlertCircle className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-[11px] text-slate-500">
              Detects missing values, duplicates, negative amounts, and bad dates.
            </p>
          </div>

          {/* Step 3: Transformation */}
          <div
            className={`p-3 rounded-lg border transition-all ${
              activeStep === 3
                ? 'bg-blue-50/60 border-blue-300 ring-1 ring-blue-500'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between font-semibold text-slate-900 mb-1">
              <span>3. Transformation</span>
              <RotateCcw className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-[11px] text-slate-500">
              Standardizes ISO dates, trims locations, and casts numeric currencies.
            </p>
          </div>

          {/* Step 4: Storage */}
          <div
            className={`p-3 rounded-lg border transition-all ${
              activeStep === 4 || loadResult
                ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-500'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between font-semibold text-slate-900 mb-1">
              <span>4. Warehouse Load</span>
              <Database className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-[11px] text-slate-500">
              Atomic insertion into Fact_Transactions and Conformed Star Dimensions.
            </p>
          </div>
        </div>
      </div>

      {/* A. Data Collection: Upload & Preview */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">A. Data Collection (CSV Ingestion)</h3>
            <p className="text-xs text-slate-500">
              Upload raw financial transaction CSV file or drag and drop into the dropzone.
            </p>
          </div>
          {filename && (
            <span className="text-xs font-mono font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded">
              File: {filename}
            </span>
          )}
        </div>

        {/* Upload Dropzone */}
        <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/20 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors">
          <Upload className="w-8 h-8 text-slate-400 mb-2" />
          <span className="text-xs font-semibold text-slate-800">
            Click to upload transaction CSV or drag file here
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5">
            Expected fields: Transaction_ID, Account_ID, Transaction_Amount, Transaction_Date, Transaction_Time, Location, Transaction_Type
          </span>
          <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
        </label>

        {/* Preview Table */}
        {previewData && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <span>
                  Total Detected Rows:{' '}
                  <strong className="font-mono text-slate-900">{previewData.totalRows}</strong>
                </span>
                <span>·</span>
                <span>
                  Columns: <strong className="font-mono text-slate-900">{previewData.columnCount}</strong>
                </span>
              </div>
              <button
                onClick={runDataCleaning}
                disabled={cleaningInProgress}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs transition-colors disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{cleaningInProgress ? 'Analyzing Rows...' : 'Run Data Cleaning Pipeline →'}</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-md overflow-x-auto max-h-56">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                    {previewData.headers.map((h) => (
                      <th key={h} className="py-2 px-3 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-mono text-[11px]">
                  {previewData.rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      {previewData.headers.map((h) => (
                        <td key={h} className="py-2 px-3 whitespace-nowrap">
                          {String(row[h] || '—')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* B. Data Cleaning: Quality Metrics & Issues Review */}
      {cleaningResult && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">B. Data Cleaning Audit Report</h3>
              <p className="text-xs text-slate-500">
                Integrity evaluation across nulls, primary keys, date formats, and value ranges.
              </p>
            </div>
            <button
              onClick={runTransformAndLoad}
              disabled={loadingToDb || cleaningResult.cleanTransactions.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-xs transition-colors disabled:opacity-50"
            >
              <Database className="w-3.5 h-3.5" />
              <span>
                {loadingToDb
                  ? 'Inserting into Warehouse...'
                  : `Commit ${cleaningResult.cleanRecordsCount} Clean Records to Database →`}
              </span>
            </button>
          </div>

          {/* Cleaning Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <StatCard
              title="Total Rows"
              value={cleaningResult.totalRows}
              subtitle="Evaluated in batch"
            />
            <StatCard
              title="Missing Values"
              value={cleaningResult.missingValuesCount + cleaningResult.missingAccountsCount}
              subtitle="Empty key/account fields"
              highlightColor="amber"
            />
            <StatCard
              title="Duplicate Records"
              value={cleaningResult.duplicateRecordsCount}
              subtitle="Collision on TXN_ID"
              highlightColor="amber"
            />
            <StatCard
              title="Invalid Records"
              value={cleaningResult.invalidAmountsCount + cleaningResult.invalidDatesCount}
              subtitle="Negative or bad dates"
              highlightColor="red"
            />
            <StatCard
              title="Clean Records"
              value={cleaningResult.cleanRecordsCount}
              subtitle="Passed all validations"
              highlightColor="emerald"
            />
          </div>

          {/* Issues Audit Table */}
          {cleaningResult.issues.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-semibold text-slate-700 block">
                Flagged Discrepancies Awaiting Resolution ({cleaningResult.issues.length}):
              </span>
              <div className="border border-slate-200 rounded-md overflow-x-auto max-h-56">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-red-50/60 border-b border-red-200 text-red-900 font-semibold text-[11px]">
                      <th className="py-2 px-3">CSV Row #</th>
                      <th className="py-2 px-3">Transaction ID</th>
                      <th className="py-2 px-3">Attribute</th>
                      <th className="py-2 px-3">Issue Category</th>
                      <th className="py-2 px-3">Raw Value</th>
                      <th className="py-2 px-3">System Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 text-[11px]">
                    {cleaningResult.issues.map((issue, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono font-bold text-slate-800">
                          Row {issue.rowNumber}
                        </td>
                        <td className="py-2 px-3 font-mono">{issue.transactionId || 'NULL'}</td>
                        <td className="py-2 px-3 font-medium text-slate-800">{issue.field}</td>
                        <td className="py-2 px-3">
                          <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-semibold">
                            {issue.issueType.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-500">
                          {issue.rawValue || '<empty>'}
                        </td>
                        <td className="py-2 px-3 text-slate-600">{issue.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* C & D. Data Storage Status Banner */}
      {loadResult && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-emerald-900">
                ETL Load Completed Successfully
              </h4>
              <p className="text-xs text-emerald-700 mt-0.5">
                Inserted <strong className="font-mono">{loadResult.insertedCount}</strong> validated transactions into operational database and refreshed Data Warehouse Star Schema (<strong className="font-mono">{loadResult.warehouseFactsCount}</strong> cumulative facts) in {loadResult.durationMs}ms.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-semibold text-emerald-800 bg-emerald-100 px-3 py-1 rounded">
            Batch ID: {loadResult.uploadId}
          </span>
        </div>
      )}

      {/* E. Data Aggregation Analytics */}
      {aggregations && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">E. Multidimensional Data Aggregations</h3>
            <p className="text-xs text-slate-500">
              Aggregated cubes across Location volume and Account transaction frequency.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Locations by Volume */}
            <div>
              <span className="text-xs font-semibold text-slate-700 block mb-2">
                Settlement Amount by Origin Geographic Location ($ USD)
              </span>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={aggregations.topLocations} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="location" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Total Amount']}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#cbd5e1',
                        borderRadius: '6px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="amount" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Accounts by Volume */}
            <div>
              <span className="text-xs font-semibold text-slate-700 block mb-2">
                High-Volume Account Profiles (Top 8 Cumulative Settle)
              </span>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={aggregations.topAccounts} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="account" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Total Amount']}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#cbd5e1',
                        borderRadius: '6px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="amount" fill="#0891b2" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
