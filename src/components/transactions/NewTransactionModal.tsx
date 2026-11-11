import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { api } from '../../api/client';
import { TransactionType } from '../../types';

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newTxnId: string) => void;
}

export const NewTransactionModal: React.FC<NewTransactionModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [accountId, setAccountId] = useState('ACC1017');
  const [amount, setAmount] = useState('150.00');
  const [location, setLocation] = useState('New York');
  const [transactionType, setTransactionType] = useState<TransactionType>('POS');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [transactionTime, setTransactionTime] = useState('14:30:00');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const numAmt = parseFloat(amount);
    if (isNaN(numAmt) || numAmt <= 0) {
      setError('Please enter a valid positive transaction amount.');
      return;
    }
    if (!accountId.trim() || !location.trim()) {
      setError('Account ID and Location are required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.createTransaction({
        account_id: accountId.trim(),
        transaction_amount: numAmt,
        location: location.trim(),
        transaction_type: transactionType,
        transaction_date: transactionDate,
        transaction_time: transactionTime,
      });
      onCreated(res.transaction.transaction_id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create transaction');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Financial Transaction"
      subtitle="Transaction will be analyzed by FinGuard fraud engine in real-time."
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-medium text-slate-700 block mb-1">Account ID</label>
            <input
              type="text"
              required
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder="e.g. ACC1017"
              className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
            />
          </div>

          <div>
            <label className="font-medium text-slate-700 block mb-1">Amount ($ USD)</label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono tabular-nums"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-medium text-slate-700 block mb-1">Channel / Type</label>
            <select
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value as TransactionType)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="POS">POS (Point of Sale)</option>
              <option value="Online">Online / E-Commerce</option>
              <option value="ATM">ATM Withdrawal</option>
              <option value="Wire Transfer">Wire Transfer</option>
              <option value="Mobile Transfer">Mobile Transfer</option>
            </select>
          </div>

          <div>
            <label className="font-medium text-slate-700 block mb-1">Location</label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. New York, Chicago, Zurich"
              className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-medium text-slate-700 block mb-1">Transaction Date</label>
            <input
              type="date"
              required
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
            />
          </div>

          <div>
            <label className="font-medium text-slate-700 block mb-1">Transaction Time</label>
            <input
              type="text"
              required
              value={transactionTime}
              onChange={(e) => setTransactionTime(e.target.value)}
              placeholder="HH:MM:SS"
              className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors shadow-xs disabled:opacity-50"
          >
            {submitting ? 'Processing...' : 'Submit & Analyze'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
