import React, { useState, useEffect } from 'react';
import {
  ArrowLeftRight,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  DollarSign,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { DashboardStats, Transaction, SuspiciousAlert } from '../../types';
import { StatCard } from '../ui/StatCard';
import { RiskBadge } from '../ui/RiskBadge';
import { api } from '../../api/client';

interface DashboardViewProps {
  onSelectTransaction: (txnId: string) => void;
  onNavigateToAlerts: () => void;
  onNavigateToTransactions: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onSelectTransaction,
  onNavigateToAlerts,
  onNavigateToTransactions,
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const data = await api.getDashboardStats();
      setStats(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading && !stats) {
    return (
      <div className="py-24 text-center">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
        <p className="text-xs text-slate-500 font-mono">Aggregating live transaction statistics and fraud metrics...</p>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
        <p className="font-semibold">Failed to load dashboard metrics</p>
        <p className="mt-1">{error}</p>
        <button
          onClick={handleRefresh}
          className="mt-3 px-3 py-1.5 bg-red-600 text-white rounded text-xs hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const kpis = stats!.kpis;
  const charts = stats!.charts;

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Financial Transaction Analysis</h2>
          <p className="text-xs text-slate-500">
            Real-time AML rule evaluation, statistical anomaly detection, and dimensional warehousing facts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md shadow-2xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Updating...' : 'Refresh Feed'}</span>
          </button>
        </div>
      </div>

      {/* 5 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Transactions"
          value={kpis.totalTransactions.toLocaleString()}
          subtitle="Processed in data warehouse"
          icon={<ArrowLeftRight className="w-4 h-4" />}
          trend={{ value: '100%', neutral: true }}
        />
        <StatCard
          title="Normal Transactions"
          value={kpis.normalTransactions.toLocaleString()}
          subtitle={`${((kpis.normalTransactions / (kpis.totalTransactions || 1)) * 100).toFixed(1)}% of total volume`}
          icon={<ShieldCheck className="w-4 h-4 text-emerald-600" />}
          highlightColor="emerald"
          trend={{ value: 'Verified', isPositive: true }}
        />
        <StatCard
          title="Suspicious Transactions"
          value={kpis.suspiciousTransactions.toLocaleString()}
          subtitle="Medium & High risk flags"
          icon={<AlertTriangle className="w-4 h-4 text-amber-600" />}
          highlightColor="amber"
          trend={{ value: 'Under Review' }}
        />
        <StatCard
          title="High-Risk Transactions"
          value={kpis.highRiskTransactions.toLocaleString()}
          subtitle="Critical threshold anomalies"
          icon={<AlertOctagon className="w-4 h-4 text-red-600" />}
          highlightColor="red"
          trend={{ value: 'Immediate AML Action' }}
        />
        <StatCard
          title="Total Volume"
          value={`$${kpis.totalTransactionAmount.toLocaleString('en-US', {
            maximumFractionDigits: 0,
          })}`}
          subtitle="Cumulative settlement (USD)"
          icon={<DollarSign className="w-4 h-4 text-blue-600" />}
          highlightColor="blue"
        />
      </div>

      {/* Charts Grid: Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction Volume & Trends (Area Chart) */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Transaction Trends (Daily Volume)</h3>
              <p className="text-xs text-slate-500">Total daily transactions vs. flagged suspicious anomalies</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span>Total</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Suspicious</span>
              </span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.dailyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorSuspicious" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(v) => v.slice(5)}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#cbd5e1',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" name="Total" />
                <Area type="monotone" dataKey="suspicious" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorSuspicious)" name="Suspicious" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution (Donut Chart) */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs flex flex-col">
          <div className="mb-2">
            <h3 className="text-sm font-semibold text-slate-900">Risk Distribution</h3>
            <p className="text-xs text-slate-500">Classification of records by risk tier</p>
          </div>
          <div className="h-52 my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.riskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {charts.riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`${val} transactions`, 'Count']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#cbd5e1',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
            {charts.riskDistribution.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="truncate">{item.name}</span>
                </span>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  {item.value} ({((item.value / (kpis.totalTransactions || 1)) * 100).toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Grid: Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaction Amount Analysis by Type */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Volume by Channel / Transaction Type</h3>
              <p className="text-xs text-slate-500">Cumulative settlement amount ($ USD) across channels</p>
            </div>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.typeAnalysis} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="type" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Total Volume']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#cbd5e1',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Suspicious Activity Queue */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Active High-Priority Suspicious Alerts</h3>
              <p className="text-xs text-slate-500">Latest transactions requiring AML officer triage</p>
            </div>
            <button
              onClick={onNavigateToAlerts}
              className="text-xs text-blue-600 font-medium hover:text-blue-700 inline-flex items-center gap-1"
            >
              <span>View All Alerts</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 divide-y divide-slate-100 overflow-y-auto max-h-60">
            {stats!.recentAlerts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No pending suspicious alerts. All transactions nominal.
              </div>
            ) : (
              stats!.recentAlerts.map((alert) => (
                <div
                  key={alert.alert_id}
                  onClick={() => onSelectTransaction(alert.transaction_id)}
                  className="py-2.5 px-2 hover:bg-slate-50 rounded cursor-pointer transition-colors flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {alert.transaction_id}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        ({alert.transaction?.account_id})
                      </span>
                      {alert.analysis && (
                        <RiskBadge level={alert.analysis.risk_level} score={alert.analysis.risk_score} showScore />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 truncate mt-0.5">
                      {alert.analysis?.reasons[0]?.description || 'Multiple risk parameters triggered'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono text-xs font-bold text-slate-900 block tabular-nums">
                      ${alert.transaction?.transaction_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {alert.transaction?.location} · {alert.transaction?.transaction_type}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Recent Transactions Ledger</h3>
            <p className="text-xs text-slate-500">Latest 10 transactions recorded and scored</p>
          </div>
          <button
            onClick={onNavigateToTransactions}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
          >
            <span>Open Full Ledger</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-4">Transaction ID</th>
                <th className="py-2.5 px-4">Account ID</th>
                <th className="py-2.5 px-4">Amount</th>
                <th className="py-2.5 px-4">Date & Time</th>
                <th className="py-2.5 px-4">Location</th>
                <th className="py-2.5 px-4">Type</th>
                <th className="py-2.5 px-4 text-center">Risk Score</th>
                <th className="py-2.5 px-4 text-right">Risk Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {stats!.recentTransactions.map((txn) => {
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
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
