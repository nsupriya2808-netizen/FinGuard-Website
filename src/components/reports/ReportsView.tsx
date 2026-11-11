import React, { useState, useEffect } from 'react';
import {
  FileBarChart,
  Download,
  Printer,
  Calendar,
  Filter,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { api } from '../../api/client';
import { StatCard } from '../ui/StatCard';
import { RiskBadge } from '../ui/RiskBadge';

export const ReportsView: React.FC = () => {
  const [reportType, setReportType] = useState<
    'total' | 'suspicious' | 'high_risk' | 'daily' | 'monthly' | 'risk_distribution'
  >('total');
  const [summary, setSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getReportsSummary()
      .then((data) => setSummary(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading || !summary) {
    return (
      <div className="py-24 text-center text-xs text-slate-500 font-mono">
        Aggregating financial reports from data warehouse...
      </div>
    );
  }

  return (
    <div className="space-y-6 print:m-0 print:p-0">
      {/* Header & Export Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Financial Audit Reports & Compliance Analytics
          </h2>
          <p className="text-xs text-slate-500">
            Exportable compliance dossiers and aggregated ledger summaries.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md shadow-2xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Report</span>
          </button>
          <a
            href={`/api/reports/export-csv?type=${reportType === 'high_risk' ? 'high_risk' : reportType === 'suspicious' ? 'suspicious' : 'all'}`}
            download={`finguard_report_${reportType}.csv`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Report Selector Pills */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 rounded-lg text-xs font-medium overflow-x-auto print:hidden">
        <button
          onClick={() => setReportType('total')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
            reportType === 'total' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          1. Total Transactions Report
        </button>
        <button
          onClick={() => setReportType('suspicious')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
            reportType === 'suspicious' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          2. Suspicious Transactions
        </button>
        <button
          onClick={() => setReportType('high_risk')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
            reportType === 'high_risk' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          3. High-Risk Dossier
        </button>
        <button
          onClick={() => setReportType('daily')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
            reportType === 'daily' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          4. Daily Activity Report
        </button>
        <button
          onClick={() => setReportType('monthly')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
            reportType === 'monthly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          5. Monthly Rollup
        </button>
        <button
          onClick={() => setReportType('risk_distribution')}
          className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
            reportType === 'risk_distribution' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          6. Risk Distribution
        </button>
      </div>

      {/* Printable Report Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-2xs space-y-6 print:border-none print:shadow-none">
        <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-blue-600 block">
              FINANCIAL INTELLIGENCE UNIT · CAPSTONE AUDIT DOSSIER
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-1">
              FinGuard Report: {reportType.toUpperCase().replace('_', ' ')}
            </h3>
            <p className="text-xs text-slate-500">
              Generated at: {new Date().toLocaleString()} · Target Database: finguard (MySQL 8.0 DW)
            </p>
          </div>
          <div className="text-right font-mono text-xs text-slate-600">
            <div>Scope: Full Operational Ledger</div>
            <div className="text-[11px] text-slate-400">Class: Internal Restricted</div>
          </div>
        </div>

        {/* Top Summary Stat Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="text-[11px] text-slate-500 block uppercase">Total Transactions</span>
            <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
              {summary.totalTransactionsCount}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="text-[11px] text-slate-500 block uppercase">Suspicious Flagged</span>
            <span className="text-xl font-bold font-mono text-amber-700 tabular-nums">
              {summary.suspiciousTransactionsCount}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="text-[11px] text-slate-500 block uppercase">High-Risk Spikes</span>
            <span className="text-xl font-bold font-mono text-red-700 tabular-nums">
              {summary.highRiskTransactionsCount}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="text-[11px] text-slate-500 block uppercase">Settled Volume (USD)</span>
            <span className="text-xl font-bold font-mono text-blue-700 tabular-nums">
              ${summary.totalVolume.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        {/* Dynamic Report Content Depending on Selection */}
        {reportType === 'daily' && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
              Daily Transaction Activity (Past 15 Days)
            </h4>
            <div className="border border-slate-200 rounded-md overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4 text-center">Transactions Count</th>
                    <th className="py-2.5 px-4 text-right">Daily Volume ($ USD)</th>
                    <th className="py-2.5 px-4 text-center">Suspicious Count</th>
                    <th className="py-2.5 px-4 text-right">Anomaly Ratio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-xs">
                  {summary.dailyReport.map((d: any) => (
                    <tr key={d.date} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-bold text-slate-900">{d.date}</td>
                      <td className="py-2.5 px-4 text-center tabular-nums">{d.count}</td>
                      <td className="py-2.5 px-4 text-right font-semibold text-slate-900 tabular-nums">
                        ${d.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-4 text-center text-amber-700 tabular-nums">
                        {d.suspicious}
                      </td>
                      <td className="py-2.5 px-4 text-right tabular-nums">
                        {((d.suspicious / (d.count || 1)) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {reportType === 'monthly' && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
              Monthly Rollup Aggregation (OLAP Cube)
            </h4>
            <div className="border border-slate-200 rounded-md overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                    <th className="py-2.5 px-4">Billing Month</th>
                    <th className="py-2.5 px-4 text-center">Total Volume (Txns)</th>
                    <th className="py-2.5 px-4 text-right">Cumulative Amount ($ USD)</th>
                    <th className="py-2.5 px-4 text-center">High-Risk Interventions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-xs">
                  {summary.monthlyReport.map((m: any) => (
                    <tr key={m.month} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{m.month}</td>
                      <td className="py-3 px-4 text-center tabular-nums">{m.count}</td>
                      <td className="py-3 px-4 text-right font-bold text-blue-700 tabular-nums">
                        ${m.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center text-red-700 font-bold tabular-nums">
                        {m.highRisk}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {(reportType === 'total' ||
          reportType === 'suspicious' ||
          reportType === 'high_risk' ||
          reportType === 'risk_distribution') && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
              Sample High-Risk Flagged Transactions Dossier (Top 10)
            </h4>
            <div className="border border-slate-200 rounded-md overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                    <th className="py-2 px-3">Transaction ID</th>
                    <th className="py-2 px-3">Account ID</th>
                    <th className="py-2 px-3">Amount ($ USD)</th>
                    <th className="py-2 px-3">Location</th>
                    <th className="py-2 px-3">Channel</th>
                    <th className="py-2 px-3">Date & Time</th>
                    <th className="py-2 px-3 text-center">Score</th>
                    <th className="py-2 px-3">Risk Tier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-700">
                  {summary.highRiskSample.map((t: any) => (
                    <tr key={t.transaction_id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-blue-600 font-bold">{t.transaction_id}</td>
                      <td className="py-2 px-3">{t.account_id}</td>
                      <td className="py-2 px-3 font-semibold text-slate-900 tabular-nums">
                        ${t.transaction_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 font-sans font-medium">{t.location}</td>
                      <td className="py-2 px-3">{t.transaction_type}</td>
                      <td className="py-2 px-3 text-slate-500 tabular-nums">
                        {t.transaction_date} · {t.transaction_time}
                      </td>
                      <td className="py-2 px-3 text-center font-bold text-red-600">
                        {t.analysis?.risk_score}
                      </td>
                      <td className="py-2 px-3">
                        <RiskBadge level={t.analysis?.risk_level || 'High'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Compliance Certification Note */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
          <span>FinGuard Financial Intelligence · Data Warehousing Capstone</span>
          <span>Verified & Certified for Academic Defense</span>
        </div>
      </div>
    </div>
  );
};
