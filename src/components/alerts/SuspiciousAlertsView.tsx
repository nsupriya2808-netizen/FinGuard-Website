import React, { useState, useEffect } from 'react';
import {
  BellRing,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Search,
  ExternalLink,
  MessageSquare,
  FileCheck,
} from 'lucide-react';
import { SuspiciousAlert, InvestigationStatus } from '../../types';
import { RiskBadge } from '../ui/RiskBadge';
import { api } from '../../api/client';

interface SuspiciousAlertsViewProps {
  onSelectTransaction: (id: string) => void;
}

export const SuspiciousAlertsView: React.FC<SuspiciousAlertsViewProps> = ({
  onSelectTransaction,
}) => {
  const [alerts, setAlerts] = useState<SuspiciousAlert[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeAlertForNotes, setActiveAlertForNotes] = useState<SuspiciousAlert | null>(null);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = await api.getAlerts(statusFilter !== 'all' ? statusFilter : undefined);
      setAlerts(data);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [statusFilter]);

  const handleStatusChange = async (alertId: string, newStatus: InvestigationStatus) => {
    try {
      await api.updateAlertStatus(alertId, newStatus);
      fetchAlerts();
    } catch (err: any) {
      alert(err.message || 'Failed to update alert status');
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAlertForNotes || !noteText.trim()) return;
    setSavingNote(true);
    try {
      await api.addAlertNote(activeAlertForNotes.alert_id, 'Analyst Review', noteText.trim());
      setNoteText('');
      setActiveAlertForNotes(null);
      fetchAlerts();
    } catch (err: any) {
      alert(err.message || 'Failed to add note');
    } finally {
      setSavingNote(false);
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      alert.transaction_id.toLowerCase().includes(q) ||
      (alert.transaction?.account_id || '').toLowerCase().includes(q) ||
      (alert.transaction?.location || '').toLowerCase().includes(q) ||
      (alert.analysis?.reasons[0]?.description || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Suspicious Transaction Alerts & Investigation Queue
          </h2>
          <p className="text-xs text-slate-500">
            Compliance triage workflow for high-risk and anomalous financial movements.
          </p>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Alerts ({alerts.length})
            </button>
            <button
              onClick={() => setStatusFilter('Pending')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                statusFilter === 'Pending'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter('Under Review')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                statusFilter === 'Under Review'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Under Review
            </button>
            <button
              onClick={() => setStatusFilter('Confirmed Fraud')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                statusFilter === 'Confirmed Fraud'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Confirmed Fraud
            </button>
            <button
              onClick={() => setStatusFilter('False Positive / Resolved')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                statusFilter === 'False Positive / Resolved'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Resolved
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search alerts queue..."
              className="w-full bg-slate-50 border border-slate-300 rounded pl-8 pr-3 py-1 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-4">Alert ID</th>
                <th className="py-2.5 px-4">Transaction / Account</th>
                <th className="py-2.5 px-4">Amount</th>
                <th className="py-2.5 px-4">Date & Time</th>
                <th className="py-2.5 px-4">Location</th>
                <th className="py-2.5 px-4">Primary Reason Flagged</th>
                <th className="py-2.5 px-4 text-center">Score</th>
                <th className="py-2.5 px-4">Triage Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-mono text-xs">
                    Loading compliance alerts...
                  </td>
                </tr>
              ) : filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                    No alerts found for the current criteria.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert) => {
                  const txn = alert.transaction;
                  const analysis = alert.analysis;
                  return (
                    <tr key={alert.alert_id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {alert.alert_id}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <button
                          onClick={() => onSelectTransaction(alert.transaction_id)}
                          className="text-blue-600 hover:text-blue-800 hover:underline font-semibold block text-left"
                        >
                          {alert.transaction_id}
                        </button>
                        <span className="text-[11px] text-slate-400 block">
                          {txn?.account_id || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 tabular-nums">
                        ${txn?.transaction_amount?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 tabular-nums">
                        {txn?.transaction_date || '—'}
                        <span className="text-[10px] block text-slate-400">{txn?.transaction_time}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {txn?.location || '—'}
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <span className="text-slate-800 block truncate" title={analysis?.reasons[0]?.description}>
                          {analysis?.reasons[0]?.description || 'Multi-factor risk threshold exceeded'}
                        </span>
                        {analysis?.reasons && analysis.reasons.length > 1 && (
                          <span className="text-[10px] text-red-600 font-medium">
                            +{analysis.reasons.length - 1} additional anomaly factor(s)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {analysis ? (
                          <RiskBadge level={analysis.risk_level} score={analysis.risk_score} showScore />
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={alert.investigation_status}
                          onChange={(e) =>
                            handleStatusChange(alert.alert_id, e.target.value as InvestigationStatus)
                          }
                          className="bg-slate-100 border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Under Review">Under Review</option>
                          <option value="Confirmed Fraud">Confirmed Fraud</option>
                          <option value="False Positive / Resolved">Resolved</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setActiveAlertForNotes(alert)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"
                            title="Add Audit Note"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onSelectTransaction(alert.transaction_id)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                            title="View Complete Audit"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Note Addition Drawer Modal */}
      {activeAlertForNotes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Add Investigation Note ({activeAlertForNotes.alert_id})
            </h3>
            <p className="text-xs text-slate-500">
              Appends an immutable compliance audit record for transaction {activeAlertForNotes.transaction_id}.
            </p>
            <form onSubmit={handleAddNote} className="space-y-3">
              <textarea
                rows={3}
                required
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Document your findings, customer communication, or law enforcement referral..."
                className="w-full bg-slate-50 border border-slate-300 rounded p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveAlertForNotes(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingNote}
                  className="px-3 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50"
                >
                  {savingNote ? 'Logging...' : 'Save Audit Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
