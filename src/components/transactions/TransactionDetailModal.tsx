import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { RiskBadge } from '../ui/RiskBadge';
import { TransactionDetailResponse, InvestigationStatus } from '../../types';
import { api } from '../../api/client';
import {
  CreditCard,
  MapPin,
  Clock,
  Calendar,
  UserCheck,
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  History,
  Send,
} from 'lucide-react';

interface TransactionDetailModalProps {
  transactionId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onAlertUpdated?: () => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transactionId,
  isOpen,
  onClose,
  onAlertUpdated,
}) => {
  const [data, setData] = useState<TransactionDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<InvestigationStatus>('Pending');
  const [noteText, setNoteText] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (isOpen && transactionId) {
      setLoading(true);
      setError(null);
      setActionSuccess(null);
      api
        .getTransactionDetails(transactionId)
        .then((res) => {
          setData(res);
          if (res.alert) {
            setNewStatus(res.alert.investigation_status);
          }
        })
        .catch((err) => {
          setError(err.message || 'Failed to load transaction details');
        })
        .finally(() => setLoading(false));
    } else {
      setData(null);
    }
  }, [isOpen, transactionId]);

  const handleUpdateStatus = async () => {
    if (!data?.alert) return;
    setUpdating(true);
    setActionSuccess(null);
    try {
      await api.updateAlertStatus(data.alert.alert_id, newStatus, noteText);
      setActionSuccess('Investigation status updated successfully.');
      setNoteText('');
      // Refresh details
      const refreshed = await api.getTransactionDetails(data.transaction.transaction_id);
      setData(refreshed);
      if (onAlertUpdated) onAlertUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to update alert');
    } finally {
      setUpdating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={data ? `Transaction Audit: ${data.transaction.transaction_id}` : 'Transaction Details'}
      subtitle={data ? `Processed on ${data.transaction.transaction_date} at ${data.transaction.transaction_time}` : ''}
      maxWidth="max-w-3xl"
    >
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500 font-mono">
          Loading transaction analytics and risk metadata...
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded text-xs">
          {error}
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Top Key Metrics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div>
              <span className="text-[11px] text-slate-500 block uppercase font-medium">Amount</span>
              <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
                ${data.transaction.transaction_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block uppercase font-medium">Risk Score</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
                  {data.analysis?.risk_score ?? 'N/A'}
                </span>
                <span className="text-xs text-slate-400">/ 100</span>
              </div>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block uppercase font-medium">Classification</span>
              <div className="mt-1">
                {data.analysis ? (
                  <RiskBadge level={data.analysis.risk_level} />
                ) : (
                  <span className="text-xs text-slate-500">Unscored</span>
                )}
              </div>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block uppercase font-medium">Triage Status</span>
              <div className="mt-1">
                <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-slate-200 text-slate-800">
                  {data.alert ? data.alert.investigation_status : 'Normal / Logged'}
                </span>
              </div>
            </div>
          </div>

          {/* Primary Transaction Attributes */}
          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
              Transaction Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 p-2.5 rounded border border-slate-200 bg-white">
                <UserCheck className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <span className="text-slate-500 block text-[11px]">Account ID</span>
                  <span className="font-mono font-semibold text-slate-900">{data.transaction.account_id}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded border border-slate-200 bg-white">
                <CreditCard className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <span className="text-slate-500 block text-[11px]">Channel / Type</span>
                  <span className="font-medium text-slate-900">{data.transaction.transaction_type}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded border border-slate-200 bg-white">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <span className="text-slate-500 block text-[11px]">Origin Location</span>
                  <span className="font-medium text-slate-900">{data.transaction.location}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded border border-slate-200 bg-white">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <span className="text-slate-500 block text-[11px]">Timestamp</span>
                  <span className="font-mono text-slate-900">
                    {data.transaction.transaction_date} · {data.transaction.transaction_time}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Anomaly Detection Flags */}
          {data.analysis && (
            <div>
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
                Anomaly Detection Indicators
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div
                  className={`p-2.5 rounded border ${
                    data.analysis.anomaly_amount_flag
                      ? 'bg-red-50 border-red-200 text-red-800'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <span className="font-medium block">Amount Outlier</span>
                  <span className="text-[11px]">
                    {data.analysis.anomaly_amount_flag ? 'Flagged (>Threshold)' : 'Within normal limits'}
                  </span>
                </div>

                <div
                  className={`p-2.5 rounded border ${
                    data.analysis.anomaly_time_flag
                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <span className="font-medium block">Nocturnal Window</span>
                  <span className="text-[11px]">
                    {data.analysis.anomaly_time_flag ? 'Flagged (01:00-05:00)' : 'Standard diurnal time'}
                  </span>
                </div>

                <div
                  className={`p-2.5 rounded border ${
                    data.analysis.anomaly_location_flag
                      ? 'bg-red-50 border-red-200 text-red-800'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <span className="font-medium block">Location / Jurisdiction</span>
                  <span className="text-[11px]">
                    {data.analysis.anomaly_location_flag ? 'High-risk or foreign hub' : 'Domestic verified city'}
                  </span>
                </div>

                <div
                  className={`p-2.5 rounded border ${
                    data.analysis.anomaly_frequency_flag
                      ? 'bg-red-50 border-red-200 text-red-800'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <span className="font-medium block">Velocity Burst</span>
                  <span className="text-[11px]">
                    {data.analysis.anomaly_frequency_flag ? 'Multiple repeat txns' : 'Standard velocity'}
                  </span>
                </div>

                <div
                  className={`p-2.5 rounded border ${
                    data.analysis.anomaly_type_flag
                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <span className="font-medium block">Channel Risk</span>
                  <span className="text-[11px]">
                    {data.analysis.anomaly_type_flag ? 'High-value wire/cash' : 'Standard retail channel'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Detailed Contributing Risk Reasons */}
          {data.analysis?.reasons && data.analysis.reasons.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2">
                Risk Scoring Factor Rationale
              </h4>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-md bg-white overflow-hidden">
                {data.analysis.reasons.map((r, i) => (
                  <div key={i} className="p-3 flex items-start justify-between gap-3 text-xs">
                    <div>
                      <span className="font-semibold text-slate-800 block">{r.factor}</span>
                      <p className="text-slate-600 mt-0.5">{r.description}</p>
                    </div>
                    {r.points > 0 ? (
                      <span className="font-mono font-bold text-red-600 shrink-0 tabular-nums">
                        +{r.points} pts
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-medium shrink-0">0 pts</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Account Profile Context */}
          <div className="bg-slate-50 border border-slate-200 rounded-md p-3 text-xs flex items-center justify-between">
            <div>
              <span className="font-medium text-slate-800">Account Historical Context:</span>
              <span className="text-slate-600 ml-2">
                {data.accountHistoryCount} total transactions on record
              </span>
            </div>
            <span className="font-mono font-bold text-slate-900 tabular-nums">
              Cumulative Volume: ${data.accountTotalVolume.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Investigation Actions & Audit Trail */}
          {data.alert && (
            <div className="border-t border-slate-200 pt-4">
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
                Fraud Investigation & Audit
              </h4>

              {/* Status and Note Form */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <label className="text-xs font-medium text-slate-700 sm:w-32">
                    Investigation Status:
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as InvestigationStatus)}
                    className="flex-1 bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="Pending">Pending (Awaiting Review)</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Confirmed Fraud">Confirmed Fraud</option>
                    <option value="False Positive / Resolved">False Positive / Resolved</option>
                  </select>
                </div>

                <div>
                  <textarea
                    rows={2}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add compliance notes or investigation findings..."
                    className="w-full bg-white border border-slate-300 rounded p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div className="flex items-center justify-between">
                  {actionSuccess && (
                    <span className="text-xs text-emerald-600 font-medium">{actionSuccess}</span>
                  )}
                  {!actionSuccess && <span />}
                  <button
                    onClick={handleUpdateStatus}
                    disabled={updating}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{updating ? 'Saving...' : 'Update Status & Log Note'}</span>
                  </button>
                </div>
              </div>

              {/* Past Audit Notes */}
              {data.notes && data.notes.length > 0 && (
                <div className="mt-4 space-y-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Audit Log History ({data.notes.length})
                  </span>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {data.notes.map((n) => (
                      <div key={n.id} className="p-2.5 rounded bg-white border border-slate-200 text-xs">
                        <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
                          <span className="font-semibold text-slate-700">{n.investigator_email}</span>
                          <span className="font-mono">{new Date(n.logged_at).toLocaleString()}</span>
                        </div>
                        <span className="text-slate-500 font-medium mr-1.5">[{n.action_taken}]:</span>
                        <span className="text-slate-800">{n.notes}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}
    </Modal>
  );
};
