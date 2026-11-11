import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  UserPlus,
  KeyRound,
  Trash2,
  CheckCircle,
  AlertTriangle,
  History,
  Server,
  Database,
  Lock,
  RefreshCw,
  Search,
} from 'lucide-react';
import { User, UserRole, AuditLogRecord } from '../../types';
import { api } from '../../api/client';
import { StatCard } from '../ui/StatCard';
import { Modal } from '../ui/Modal';

interface AdminConsoleViewProps {
  currentUser: User | null;
}

export const AdminConsoleView: React.FC<AdminConsoleViewProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // New user modal
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('analyst');
  const [creatingUser, setCreatingUser] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersData, logsData] = await Promise.all([
        api.getAdminUsers(),
        api.getAdminAuditLogs(),
      ]);
      setUsers(usersData);
      setAuditLogs(logsData);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRoleChange = async (userId: string, newRoleVal: UserRole) => {
    try {
      await api.updateUserRole(userId, newRoleVal);
      setActionSuccess(`User role updated to ${newRoleVal.toUpperCase()}.`);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update user role');
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (email === currentUser?.email) {
      alert('You cannot delete your own active administrator account.');
      return;
    }
    if (!confirm(`Are you sure you want to revoke and delete user account ${email}?`)) {
      return;
    }
    try {
      await api.deleteUser(userId);
      setActionSuccess(`User ${email} removed from the system.`);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    }
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setCreatingUser(true);
    try {
      await api.createAdminUser({
        fullName: newFullName,
        email: newEmail,
        password: newPassword,
        role: newRole,
      });
      setIsNewUserModalOpen(false);
      setNewFullName('');
      setNewEmail('');
      setNewPassword('');
      setActionSuccess(`New ${newRole.toUpperCase()} user created successfully.`);
      fetchData();
    } catch (err: any) {
      setModalError(err.message || 'Failed to create user');
    } finally {
      setCreatingUser(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="py-24 text-center text-xs text-slate-500 font-mono">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
        Loading Administrator Control Console & Security Audits...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Administrator Security & Role Management Console
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage system operators, assign access privileges (Admin, Analyst, User), and monitor immutable security audit logs.
          </p>
        </div>
        <button
          onClick={() => setIsNewUserModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-xs transition-colors"
        >
          <UserPlus className="w-4 h-4 text-amber-400" />
          <span>Provision New Account</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          title="Provisioned Users"
          value={users.length}
          subtitle="Active accounts in database"
          icon={<Users className="w-4 h-4 text-blue-600" />}
        />
        <StatCard
          title="System Administrators"
          value={users.filter((u) => u.role === 'admin').length}
          subtitle="Full root privileges"
          icon={<Shield className="w-4 h-4 text-amber-600" />}
          highlightColor="amber"
        />
        <StatCard
          title="Operational Analysts"
          value={users.filter((u) => u.role === 'analyst' || u.role === 'fraud_investigator').length}
          subtitle="AML & Fraud investigators"
          icon={<KeyRound className="w-4 h-4 text-emerald-600" />}
          highlightColor="emerald"
        />
        <StatCard
          title="Security Audit Logs"
          value={auditLogs.length}
          subtitle="Recorded events on disk"
          icon={<History className="w-4 h-4 text-slate-600" />}
        />
      </div>

      {/* Section 1: User Accounts Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">User Access Control List (RBAC)</h3>
            <p className="text-xs text-slate-500">
              Accounts authorized to interact with transaction data and compliance workflows
            </p>
          </div>
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or role..."
              className="w-full bg-slate-50 border border-slate-300 rounded pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-4">User ID</th>
                <th className="py-2.5 px-4">Full Name</th>
                <th className="py-2.5 px-4">Email Address</th>
                <th className="py-2.5 px-4">Current Role</th>
                <th className="py-2.5 px-4">Created Date</th>
                <th className="py-2.5 px-4">Privilege Level</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredUsers.map((user) => {
                const isAdmin = user.role === 'admin';
                return (
                  <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{user.id}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{user.fullName}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{user.email}</td>
                    <td className="py-3 px-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                        className={`text-xs font-semibold rounded px-2 py-1 border transition-colors ${
                          isAdmin
                            ? 'bg-slate-900 text-amber-300 border-slate-800'
                            : user.role === 'analyst'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        <option value="admin">Administrator (Root)</option>
                        <option value="analyst">Financial Analyst</option>
                        <option value="fraud_investigator">Fraud Investigator</option>
                        <option value="user">Standard User / Auditor</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {user.createdAt ? user.createdAt.split('T')[0] : '2026-10-01'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[11px] text-slate-500">
                        {isAdmin
                          ? 'Full Admin & Security Configuration'
                          : user.role === 'analyst'
                          ? 'ETL, Transactions & Risk Scoring'
                          : 'Read-only Ledger & Report Auditing'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {user.email !== currentUser?.email && (
                        <button
                          onClick={() => handleDeleteUser(user.id, user.email)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Revoke and Delete Account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Immutable Security & System Audit Logs */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Security & Access Audit Trail</h3>
            <p className="text-xs text-slate-500">
              System access timestamps, authentication events, and critical security operations
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">
            {auditLogs.length} Logged Events
          </span>
        </div>

        <div className="overflow-x-auto max-h-72">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-4">Log ID</th>
                <th className="py-2.5 px-4">Actor Email</th>
                <th className="py-2.5 px-4">Action Event</th>
                <th className="py-2.5 px-4">Details</th>
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-700">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-bold text-slate-900">{log.id}</td>
                  <td className="py-2.5 px-4 text-blue-600">{log.userEmail}</td>
                  <td className="py-2.5 px-4 font-bold text-slate-800">{log.action}</td>
                  <td className="py-2.5 px-4 font-sans text-slate-600 max-w-sm truncate" title={log.details}>
                    {log.details}
                  </td>
                  <td className="py-2.5 px-4 text-slate-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        log.status === 'SUCCESS'
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.status === 'WARNING'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision New User Modal */}
      <Modal
        isOpen={isNewUserModalOpen}
        onClose={() => setIsNewUserModalOpen(false)}
        title="Provision New User Account"
        subtitle="Create an authorized terminal operator account with specific access privileges."
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateUserSubmit} className="space-y-4 text-xs">
          {modalError && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded">
              {modalError}
            </div>
          )}

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Full Legal Name</label>
            <input
              type="text"
              required
              value={newFullName}
              onChange={(e) => setNewFullName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Official Work Email</label>
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="e.g. jdoe@finguard.bank"
              className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Temporary Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Assigned Security Role</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as UserRole)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="analyst">Financial Crime Analyst (Default)</option>
              <option value="fraud_investigator">Fraud Investigator (AML)</option>
              <option value="user">General Auditor / Staff User</option>
              <option value="admin">System Administrator (Root)</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsNewUserModalOpen(false)}
              className="px-3 py-1.5 rounded text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creatingUser}
              className="px-4 py-1.5 rounded text-white bg-slate-900 hover:bg-slate-800 font-medium disabled:opacity-50"
            >
              {creatingUser ? 'Provisioning...' : 'Provision Account'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
