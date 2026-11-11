import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  Plus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from 'lucide-react';
import { Transaction, RiskLevel, TransactionType } from '../../types';
import { RiskBadge } from '../ui/RiskBadge';
import { api } from '../../api/client';

interface TransactionsViewProps {
  onSelectTransaction: (id: string) => void;
  onOpenNewModal: () => void;
  initialSearch?: string;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  onSelectTransaction,
  onOpenNewModal,
  initialSearch = '',
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState(initialSearch);
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await api.getTransactions({
        page,
        limit,
        search,
        riskLevel: riskFilter !== 'all' ? riskFilter : undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setTransactions(res.data);
      setTotalCount(res.pagination.total);
      setTotalPages(res.pagination.totalPages);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, limit, riskFilter, typeFilter, startDate, endDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTransactions();
  };

  const resetFilters = () => {
    setSearch('');
    setRiskFilter('all');
    setTypeFilter('all');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Financial Transactions Ledger</h2>
          <p className="text-xs text-slate-500">
            Audit repository containing all cleaned transactions stored in the operational database.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/api/reports/export-csv?type=${riskFilter === 'High' ? 'high_risk' : riskFilter === 'Medium' ? 'suspicious' : 'all'}`}
            download="finguard_transactions.csv"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </a>
          <button
            onClick={onOpenNewModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Transaction</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3 shadow-2xs">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
          {/* Search Field */}
          <div className="flex-1 min-w-[220px] relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, Account, Location..."
              className="w-full bg-slate-50 border border-slate-300 rounded pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          {/* Risk Level Filter */}
          <select
            value={riskFilter}
            onChange={(e) => {
              setRiskFilter(e.target.value as any);
              setPage(1);
            }}
            className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="all">All Risk Levels</option>
            <option value="Low">Low Risk Only</option>
            <option value="Medium">Medium Risk (Suspicious)</option>
            <option value="High">High Risk (Critical)</option>
          </select>

          {/* Transaction Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as any);
              setPage(1);
            }}
            className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="all">All Transaction Types</option>
            <option value="POS">POS</option>
            <option value="Online">Online</option>
            <option value="ATM">ATM</option>
            <option value="Wire Transfer">Wire Transfer</option>
            <option value="Mobile Transfer">Mobile Transfer</option>
          </select>

          {/* Date range inputs */}
          <div className="flex items-center gap-1 text-xs text-slate-600">
            <span>From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs"
            />
            <span>To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs"
            />
          </div>

          <button
            type="submit"
            className="px-3 py-1.5 text-xs font-medium text-white bg-slate-800 hover:bg-slate-900 rounded transition-colors"
          >
            Filter
          </button>

          {(search || riskFilter !== 'all' || typeFilter !== 'all' || startDate || endDate) && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs text-slate-500 hover:text-slate-800 underline"
            >
              Reset
            </button>
          )}
        </form>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>
            Showing <strong className="font-mono text-slate-700">{transactions.length}</strong> of{' '}
            <strong className="font-mono text-slate-700">{totalCount}</strong> transactions matching criteria
          </span>
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs text-slate-800"
            >
              <option value="15">15</option>
              <option value="30">30</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Data Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-4">Transaction ID</th>
                <th className="py-2.5 px-4">Account ID</th>
                <th className="py-2.5 px-4">Amount ($ USD)</th>
                <th className="py-2.5 px-4">Date & Time</th>
                <th className="py-2.5 px-4">Location</th>
                <th className="py-2.5 px-4">Type</th>
                <th className="py-2.5 px-4 text-center">Risk Score</th>
                <th className="py-2.5 px-4 text-right">Risk Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-mono text-xs">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                    Querying transactions database...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    No transactions match the selected filter parameters.
                  </td>
                </tr>
              ) : (
                transactions.map((txn) => {
                  const analysis = txn.analysis || { risk_score: 10, risk_level: 'Low' };
                  return (
                    <tr
                      key={txn.transaction_id}
                      onClick={() => onSelectTransaction(txn.transaction_id)}
                      className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-medium text-blue-600">
                        {txn.transaction_id}
                      </td>
                      <td className="py-3 px-4 font-mono">{txn.account_id}</td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900 tabular-nums">
                        ${txn.transaction_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-slate-500 tabular-nums">
                        {txn.transaction_date} <span className="opacity-60">·</span> {txn.transaction_time}
                      </td>
                      <td className="py-3 px-4 text-slate-700">{txn.location}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                          {txn.transaction_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold tabular-nums">
                        {analysis.risk_score}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <RiskBadge level={analysis.risk_level} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-5 py-3 border-t border-slate-200 flex items-center justify-between text-xs bg-slate-50/60">
          <span className="text-slate-500">
            Page <strong className="font-mono text-slate-800">{page}</strong> of{' '}
            <strong className="font-mono text-slate-800">{totalPages || 1}</strong>
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
