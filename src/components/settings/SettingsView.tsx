import React, { useState } from 'react';
import {
  User as UserIcon,
  Lock,
  Sliders,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Save,
  LogOut,
} from 'lucide-react';
import { User } from '../../types';
import { api } from '../../api/client';

interface SettingsViewProps {
  currentUser: User | null;
  onLogout: () => void;
  onNavigateToFraud: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  onLogout,
  onNavigateToFraud,
}) => {
  const [fullName, setFullName] = useState(currentUser?.fullName || 'Senior Fraud Analyst');
  const [email, setEmail] = useState(currentUser?.email || 'analyst@finguard.bank');
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; error?: boolean } | null>(null);

  // Reset demo data state
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      await api.updateProfile(currentUser.id, fullName, email);
      setProfileMsg('User profile updated successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);
    if (!currentUser) return;

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'New passwords do not match.', error: true });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMsg({ text: 'Password must be at least 6 characters.', error: true });
      return;
    }

    try {
      await api.updatePassword(currentUser.id, currentPassword, newPassword);
      setPasswordMsg({ text: 'Password changed successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMsg({ text: err.message || 'Failed to update password', error: true });
    }
  };

  const handleResetDemoData = async () => {
    if (
      !confirm(
        'Are you sure you want to re-seed demo data? This will reset the database to 520+ synthetic demonstration records and default analyst settings.'
      )
    ) {
      return;
    }

    setResetting(true);
    setResetMsg(null);
    try {
      const res = await api.resetDemoData();
      setResetMsg(res.message);
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err: any) {
      alert(err.message || 'Failed to reset demo dataset');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">System & Account Settings</h2>
        <p className="text-xs text-slate-500">
          Manage officer credentials, risk threshold shortcuts, and demonstration database state.
        </p>
      </div>

      {/* User Profile Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <UserIcon className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-slate-900">User Profile Information</h3>
        </div>

        {profileMsg && (
          <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded border border-emerald-200">
            {profileMsg}
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-medium text-slate-700 block mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="font-medium text-slate-700 block mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-medium text-slate-700 block mb-1">Assigned Role</label>
              <input
                type="text"
                disabled
                value={currentUser?.role || 'Senior Fraud Analyst'}
                className="w-full bg-slate-100 border border-slate-200 rounded px-3 py-2 text-slate-500 cursor-not-allowed uppercase font-semibold text-[11px]"
              />
            </div>
            <div>
              <label className="font-medium text-slate-700 block mb-1">Account ID</label>
              <input
                type="text"
                disabled
                value={currentUser?.id || 'USR101'}
                className="w-full bg-slate-100 border border-slate-200 rounded px-3 py-2 text-slate-500 cursor-not-allowed font-mono text-[11px]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors shadow-2xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Profile Changes</span>
            </button>
          </div>
        </form>
      </div>

      {/* Change Password Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Lock className="w-4 h-4 text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-900">Security & Password Management</h3>
        </div>

        {passwordMsg && (
          <div
            className={`p-3 text-xs rounded border ${
              passwordMsg.error
                ? 'bg-red-50 text-red-800 border-red-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            {passwordMsg.text}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
          <div>
            <label className="font-medium text-slate-700 block mb-1">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full max-w-sm bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
            <div>
              <label className="font-medium text-slate-700 block mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="font-medium text-slate-700 block mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-slate-800 hover:bg-slate-900 rounded transition-colors"
            >
              <span>Update Password</span>
            </button>
          </div>
        </form>
      </div>

      {/* Demo Data Reset Card */}
      <div className="bg-white rounded-lg border border-red-200 p-5 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-red-600" />
          <h3 className="text-sm font-semibold text-red-950">
            Reset Demo Database & Re-seed Transactions
          </h3>
        </div>
        <p className="text-xs text-slate-600">
          Restore the database to its pristine demo state containing 520+ synthetic transactions, normal spends, fraudulent spikes, and standard Star Schema facts. Useful when presenting to college evaluators.
        </p>

        {resetMsg && (
          <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded border border-emerald-200">
            {resetMsg}
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={handleResetDemoData}
            disabled={resetting}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded transition-colors shadow-2xs disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
            <span>{resetting ? 'Re-seeding 520+ Transactions...' : 'Reset & Re-seed Database Now'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
