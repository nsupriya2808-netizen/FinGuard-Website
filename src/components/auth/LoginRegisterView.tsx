import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  User as UserIcon,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  KeyRound,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { api } from '../../api/client';
import { User, UserRole } from '../../types';

interface LoginRegisterViewProps {
  onAuthSuccess: (user: User) => void;
}

export const LoginRegisterView: React.FC<LoginRegisterViewProps> = ({ onAuthSuccess }) => {
  // Active Portal: 'user' (Analyst / User) vs 'admin' (System Administrator)
  const [activePortal, setActivePortal] = useState<'user' | 'admin'>('user');
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Form inputs
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('analyst');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePortalSwitch = (portal: 'user' | 'admin') => {
    setActivePortal(portal);
    setIsRegisterMode(false);
    setError(null);
    if (portal === 'admin') {
      setEmail('admin@finguard.bank');
      setPassword('Admin@FinGuard2026');
    } else {
      setEmail('analyst@finguard.bank');
      setPassword('FinGuard@2026');
    }
  };

  const fillCredentials = (type: 'admin' | 'analyst' | 'user') => {
    setError(null);
    if (type === 'admin') {
      setActivePortal('admin');
      setIsRegisterMode(false);
      setEmail('admin@finguard.bank');
      setPassword('Admin@FinGuard2026');
    } else if (type === 'analyst') {
      setActivePortal('user');
      setIsRegisterMode(false);
      setEmail('analyst@finguard.bank');
      setPassword('FinGuard@2026');
    } else {
      setActivePortal('user');
      setIsRegisterMode(false);
      setEmail('user@finguard.bank');
      setPassword('User@FinGuard2026');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegisterMode) {
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }
        const res = await api.register(fullName, email, password, confirmPassword, selectedRole);
        onAuthSuccess(res.user);
      } else {
        const res = await api.login(email, password, activePortal);
        onAuthSuccess(res.user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Subtle Gradient Accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-gradient-to-b from-blue-600/10 via-blue-900/5 to-transparent blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="w-14 h-14 rounded-xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20 border border-blue-400/30">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-white font-sans">
          FinGuard Terminal
        </h2>
        <p className="mt-1 text-xs text-slate-400 font-mono tracking-wider">
          FINANCIAL TRANSACTION ANALYSIS & FRAUD DETECTION SYSTEM
        </p>
      </div>

      {/* Main Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
          {/* Top Portal Selector Bar */}
          <div className="grid grid-cols-2 bg-slate-100 border-b border-slate-200 p-1.5 gap-1.5">
            <button
              type="button"
              onClick={() => handlePortalSwitch('user')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                activePortal === 'user' && !isRegisterMode
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Analyst & User Login</span>
            </button>

            <button
              type="button"
              onClick={() => handlePortalSwitch('admin')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                activePortal === 'admin' && !isRegisterMode
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Administrator Portal</span>
            </button>
          </div>

          <div className="p-6 sm:p-8">
            {/* Context Headline */}
            <div className="mb-5 pb-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold block text-slate-400">
                  {isRegisterMode
                    ? 'Account Provisioning'
                    : activePortal === 'admin'
                    ? 'Security Clearance: Level 4'
                    : 'Security Clearance: Operational'}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  {isRegisterMode
                    ? 'Register New System Account'
                    : activePortal === 'admin'
                    ? 'Administrator Access Point'
                    : 'Analyst & Investigator Sign In'}
                </h3>
              </div>
              <span
                className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded border ${
                  activePortal === 'admin'
                    ? 'bg-slate-900 text-amber-300 border-slate-800'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}
              >
                {isRegisterMode ? 'REGISTRATION' : activePortal === 'admin' ? 'ADMIN' : 'ANALYST'}
              </span>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form className="space-y-4 text-xs" onSubmit={handleSubmit}>
              {isRegisterMode && (
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Full Legal Name</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Supriya N."
                      className="w-full bg-slate-50 border border-slate-300 rounded-md pl-9 pr-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  {activePortal === 'admin' ? 'Administrator Email' : 'Official Work Email'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={activePortal === 'admin' ? 'admin@finguard.bank' : 'analyst@finguard.bank'}
                    className="w-full bg-slate-50 border border-slate-300 rounded-md pl-9 pr-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Security Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-300 rounded-md pl-9 pr-10 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {isRegisterMode && (
                <>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Confirm Security Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-50 border border-slate-300 rounded-md pl-9 pr-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Assigned Operational Role</label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    >
                      <option value="analyst">Financial Crime Analyst (Default)</option>
                      <option value="user">General Auditor / Compliance Staff</option>
                      <option value="fraud_investigator">Fraud Investigator (AML)</option>
                      <option value="admin">System Administrator (Root clearance)</option>
                    </select>
                  </div>
                </>
              )}

              {!isRegisterMode && (
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-600 text-xs">Keep terminal session active</span>
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 ${
                  activePortal === 'admin' && !isRegisterMode
                    ? 'bg-slate-900 hover:bg-slate-800 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <span>
                  {loading
                    ? 'Authenticating Security Clearance...'
                    : isRegisterMode
                    ? 'Register Analyst Account'
                    : activePortal === 'admin'
                    ? 'Authenticate as Administrator'
                    : 'Sign In to AML Console'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Mode Switcher Link */}
            <div className="mt-4 pt-3 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(!isRegisterMode);
                  setError(null);
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                {isRegisterMode
                  ? 'Already have credentials? Return to Sign In'
                  : 'Need to provision a new user? Register Account'}
              </button>
            </div>
          </div>

          {/* Quick 1-Click Evaluation Credentials Bar */}
          <div className="bg-slate-50 border-t border-slate-200 p-4">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-2 text-center">
              Quick 1-Click College Defense Credentials
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('admin')}
                className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-medium transition-colors"
                title="Fill Admin Credentials"
              >
                <Shield className="w-3 h-3 text-amber-400" />
                <span>Admin Login</span>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('analyst')}
                className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-medium transition-colors"
                title="Fill Analyst Credentials"
              >
                <KeyRound className="w-3 h-3" />
                <span>Analyst Login</span>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('user')}
                className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 text-[11px] font-medium transition-colors"
                title="Fill General User Credentials"
              >
                <UserIcon className="w-3 h-3 text-slate-600" />
                <span>User Login</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
