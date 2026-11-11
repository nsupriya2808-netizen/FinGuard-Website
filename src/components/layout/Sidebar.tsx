import React from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Database,
  ShieldAlert,
  BellRing,
  Layers,
  FileBarChart,
  Settings,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { User } from '../../types';

export type NavItem =
  | 'dashboard'
  | 'transactions'
  | 'data-management'
  | 'fraud-detection'
  | 'alerts'
  | 'warehouse'
  | 'reports'
  | 'admin-console'
  | 'settings';

interface SidebarProps {
  currentTab: NavItem;
  onSelectTab: (tab: NavItem) => void;
  currentUser: User | null;
  onLogout: () => void;
  pendingAlertsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  onLogout,
  pendingAlertsCount,
}) => {
  const isAdmin = currentUser?.role === 'admin';

  const navItems: Array<{ id: NavItem; label: string; icon: React.ReactNode; badge?: number; adminOnly?: boolean }> = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'transactions', label: 'Transactions Ledger', icon: <ArrowLeftRight className="w-4 h-4" /> },
    { id: 'data-management', label: 'Data Management (ETL)', icon: <Database className="w-4 h-4" /> },
    { id: 'fraud-detection', label: 'Fraud Detection Engine', icon: <ShieldAlert className="w-4 h-4" /> },
    {
      id: 'alerts',
      label: 'Suspicious Alerts',
      icon: <BellRing className="w-4 h-4" />,
      badge: pendingAlertsCount,
    },
    { id: 'warehouse', label: 'Data Warehouse (Star)', icon: <Layers className="w-4 h-4" /> },
    { id: 'reports', label: 'Reports & Analytics', icon: <FileBarChart className="w-4 h-4" /> },
    ...(isAdmin
      ? ([{ id: 'admin-console', label: 'Admin Security Console', icon: <ShieldCheck className="w-4 h-4 text-amber-400" />, adminOnly: true }] as const)
      : []),
    { id: 'settings', label: 'System Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="px-6 py-5 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="overflow-hidden">
          <span className="text-base font-bold text-white tracking-tight block">FinGuard</span>
          <span className="text-[11px] text-slate-400 font-mono tracking-wider block">ANALYTICS & AML</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>Core Modules</span>
          <span className="text-[9px] font-mono text-slate-400">
            {isAdmin ? 'ADMIN' : 'USER'}
          </span>
        </div>
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                isActive
                  ? item.adminOnly
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-blue-600 text-white shadow-xs'
                  : item.adminOnly
                  ? 'text-amber-300/80 hover:text-amber-200 hover:bg-slate-800/80'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <span className={isActive ? 'text-white' : item.adminOnly ? 'text-amber-400' : 'text-slate-400'}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold tabular-nums ${
                    isActive ? 'bg-blue-700 text-white' : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom User Profile & Sign Out */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/50">
        <div className="p-3 rounded-md bg-slate-800/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span
              className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border ${
                isAdmin
                  ? 'bg-amber-400/20 text-amber-300 border-amber-400/30'
                  : currentUser?.role === 'analyst'
                  ? 'bg-blue-400/20 text-blue-300 border-blue-400/30'
                  : 'bg-slate-700 text-slate-300 border-slate-600'
              }`}
            >
              {isAdmin ? 'ADMINISTRATOR' : currentUser?.role === 'analyst' ? 'FRAUD ANALYST' : 'STANDARD USER'}
            </span>
            <button
              onClick={onLogout}
              title="Sign out of terminal"
              className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
              aria-label="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">
              {currentUser?.fullName || 'Analyst'}
            </p>
            <p className="text-[11px] text-slate-400 truncate font-mono">
              {currentUser?.email}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
