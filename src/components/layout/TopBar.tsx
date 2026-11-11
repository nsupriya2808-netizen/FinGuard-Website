import React, { useState } from 'react';
import { Search, Bell, Download, Plus, ChevronDown, CheckCircle2, AlertTriangle } from 'lucide-react';
import { User, SuspiciousAlert } from '../../types';
import { NavItem } from './Sidebar';

interface TopBarProps {
  currentTab: NavItem;
  onNavigate: (tab: NavItem) => void;
  currentUser: User | null;
  alerts: SuspiciousAlert[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenNewTransactionModal: () => void;
  onSelectAlert: (alert: SuspiciousAlert) => void;
}

const TAB_TITLES: Record<NavItem, { title: string; subtitle: string }> = {
  dashboard: { title: 'Executive Overview', subtitle: 'Real-time transaction volume and risk monitoring' },
  transactions: { title: 'Transaction Ledger', subtitle: 'Operational records, risk tags, and filters' },
  'data-management': { title: 'Data Management & ETL', subtitle: 'CSV ingestion, cleaning, transformation, and warehouse load' },
  'fraud-detection': { title: 'Fraud & Anomaly Engine', subtitle: 'Statistical pattern analysis, threshold calibration, and rule engine' },
  alerts: { title: 'Suspicious Alerts Queue', subtitle: 'Compliance investigation workflow, triage, and audit trail' },
  warehouse: { title: 'Data Warehouse Architecture', subtitle: 'Star Schema Fact_Transactions and Conformed Dimensions' },
  reports: { title: 'Reports & Analytics', subtitle: 'Comprehensive executive reports and CSV export' },
  'admin-console': { title: 'Administrator Control Console', subtitle: 'User management, privilege assignment, and system audit trail' },
  settings: { title: 'System Settings', subtitle: 'Model weights, profile, and demonstration data' },
};

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onNavigate,
  currentUser,
  alerts,
  searchQuery,
  onSearchChange,
  onOpenNewTransactionModal,
  onSelectAlert,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const pendingAlerts = alerts.filter((a) => a.investigation_status === 'Pending' || a.investigation_status === 'Under Review');
  const info = TAB_TITLES[currentTab] || { title: 'FinGuard System', subtitle: 'Financial Transaction Analysis' };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-6 shrink-0 z-20">
      {/* Zone 1: Current Page Title & Context */}
      <div className="flex flex-col min-w-0">
        <h1 className="text-base font-bold text-slate-900 tracking-tight leading-tight truncate">
          {info.title}
        </h1>
        <span className="text-xs text-slate-500 truncate hidden sm:block">
          {info.subtitle}
        </span>
      </div>

      {/* Zone 2: Global Search Bar */}
      <div className="flex-1 max-w-md relative hidden md:block">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by Transaction ID, Account, Location, or Type..."
          className="w-full bg-slate-50 border border-slate-200 rounded-md pl-9 pr-4 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
          >
            Clear
          </button>
        )}
      </div>

      {/* Zone 3: Actions & Profile */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Sample CSV Download Link */}
        <a
          href="/api/dataset/sample.csv"
          download="sample_transactions.csv"
          className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap"
          title="Download 520+ Synthetic Transaction Records CSV"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Sample CSV</span>
        </a>

        {/* Quick New Transaction Modal Trigger */}
        <button
          onClick={onOpenNewTransactionModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs transition-colors whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Transaction</span>
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserDropdown(false);
            }}
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {pendingAlerts.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-600" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg border border-slate-200 shadow-lg p-3 z-30">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-800">Suspicious Alerts</span>
                <span className="text-[11px] text-slate-500 tabular-nums">
                  {pendingAlerts.length} pending
                </span>
              </div>
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto mt-1">
                {pendingAlerts.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-500" />
                    No unresolved alerts.
                  </div>
                ) : (
                  pendingAlerts.slice(0, 5).map((alert) => (
                    <div
                      key={alert.alert_id}
                      onClick={() => {
                        setShowNotifications(false);
                        onSelectAlert(alert);
                      }}
                      className="py-2.5 px-1 hover:bg-slate-50 rounded cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-900 font-mono">
                          {alert.transaction_id}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 font-medium border border-amber-200">
                          {alert.investigation_status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 truncate">
                        {alert.analysis?.reasons[0]?.description || 'Suspicious risk parameters detected'}
                      </p>
                    </div>
                  ))
                )}
              </div>
              {pendingAlerts.length > 0 && (
                <div className="pt-2 border-t border-slate-100 text-center">
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      onNavigate('alerts');
                    }}
                    className="text-xs text-blue-600 font-medium hover:text-blue-700"
                  >
                    View All In Alert Queue →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Profile Pill / Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserDropdown(!showUserDropdown);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-md hover:bg-slate-100 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">
              {currentUser?.fullName?.charAt(0) || 'A'}
            </div>
            <span className="text-xs font-medium text-slate-700 hidden sm:inline-block">
              {currentUser?.fullName?.split(' ')[0] || 'Analyst'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg border border-slate-200 shadow-lg p-2 z-30">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-900">{currentUser?.fullName || 'Analyst'}</p>
                <p className="text-[11px] text-slate-500 font-mono truncate">{currentUser?.email}</p>
                <span className={`inline-block mt-1 text-[10px] uppercase font-bold px-1.5 py-0.2 rounded border ${
                  currentUser?.role === 'admin'
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  {currentUser?.role === 'admin' ? 'ADMINISTRATOR' : currentUser?.role === 'analyst' ? 'FRAUD ANALYST' : 'STANDARD USER'}
                </span>
              </div>
              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    onNavigate('admin-console');
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-amber-900 font-semibold hover:bg-amber-50 rounded mt-1 flex items-center justify-between"
                >
                  <span>Admin Security Console</span>
                  <span className="text-[9px] bg-amber-200 text-amber-950 px-1 rounded">ROOT</span>
                </button>
              )}
              <button
                onClick={() => {
                  setShowUserDropdown(false);
                  onNavigate('settings');
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded mt-1"
              >
                Account Settings
              </button>
              <button
                onClick={() => {
                  setShowUserDropdown(false);
                  onNavigate('warehouse');
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded"
              >
                Star Schema Architecture
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
