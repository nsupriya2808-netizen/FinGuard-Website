import React, { useState, useEffect } from 'react';
import { Sidebar, NavItem } from './Sidebar';
import { TopBar } from './TopBar';
import { User, SuspiciousAlert } from '../../types';
import { api } from '../../api/client';
import { DashboardView } from '../dashboard/DashboardView';
import { TransactionsView } from '../transactions/TransactionsView';
import { DataManagementView } from '../etl/DataManagementView';
import { FraudDetectionView } from '../fraud/FraudDetectionView';
import { SuspiciousAlertsView } from '../alerts/SuspiciousAlertsView';
import { DataWarehouseView } from '../warehouse/DataWarehouseView';
import { ReportsView } from '../reports/ReportsView';
import { SettingsView } from '../settings/SettingsView';
import { AdminConsoleView } from '../admin/AdminConsoleView';
import { TransactionDetailModal } from '../transactions/TransactionDetailModal';
import { NewTransactionModal } from '../transactions/NewTransactionModal';

interface AppLayoutProps {
  currentUser: User | null;
  onLogout: () => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ currentUser, onLogout }) => {
  const [currentTab, setCurrentTab] = useState<NavItem>('dashboard');
  const [alerts, setAlerts] = useState<SuspiciousAlert[]>([]);
  const [selectedTxnId, setSelectedTxnId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isNewTxnModalOpen, setIsNewTxnModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const refreshAlerts = async () => {
    try {
      const data = await api.getAlerts();
      setAlerts(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    refreshAlerts();
  }, [currentTab]);

  const handleOpenTransaction = (txnId: string) => {
    setSelectedTxnId(txnId);
    setIsDetailModalOpen(true);
  };

  const handleSelectAlert = (alert: SuspiciousAlert) => {
    setSelectedTxnId(alert.transaction_id);
    setIsDetailModalOpen(true);
  };

  const handleTransactionCreated = (newTxnId: string) => {
    refreshAlerts();
    handleOpenTransaction(newTxnId);
  };

  const pendingCount = alerts.filter(
    (a) => a.investigation_status === 'Pending' || a.investigation_status === 'Under Review'
  ).length;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      {/* 1. Left Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        currentUser={currentUser}
        onLogout={onLogout}
        pendingAlertsCount={pendingCount}
      />

      {/* 2. Main Viewport Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar Header */}
        <TopBar
          currentTab={currentTab}
          onNavigate={setCurrentTab}
          currentUser={currentUser}
          alerts={alerts}
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            if (q.trim() && currentTab !== 'transactions') {
              setCurrentTab('transactions');
            }
          }}
          onOpenNewTransactionModal={() => setIsNewTxnModalOpen(true)}
          onSelectAlert={handleSelectAlert}
        />

        {/* Scrollable Content Viewport */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {currentTab === 'dashboard' && (
              <DashboardView
                onSelectTransaction={handleOpenTransaction}
                onNavigateToAlerts={() => setCurrentTab('alerts')}
                onNavigateToTransactions={() => setCurrentTab('transactions')}
              />
            )}

            {currentTab === 'transactions' && (
              <TransactionsView
                onSelectTransaction={handleOpenTransaction}
                onOpenNewModal={() => setIsNewTxnModalOpen(true)}
                initialSearch={searchQuery}
              />
            )}

            {currentTab === 'data-management' && <DataManagementView />}

            {currentTab === 'fraud-detection' && <FraudDetectionView />}

            {currentTab === 'alerts' && (
              <SuspiciousAlertsView onSelectTransaction={handleOpenTransaction} />
            )}

            {currentTab === 'warehouse' && <DataWarehouseView />}

            {currentTab === 'reports' && <ReportsView />}

            {currentTab === 'admin-console' && <AdminConsoleView currentUser={currentUser} />}

            {currentTab === 'settings' && (
              <SettingsView
                currentUser={currentUser}
                onLogout={onLogout}
                onNavigateToFraud={() => setCurrentTab('fraud-detection')}
              />
            )}
          </div>
        </main>
      </div>

      {/* Full Transaction Details Audit Modal */}
      <TransactionDetailModal
        transactionId={selectedTxnId}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onAlertUpdated={refreshAlerts}
      />

      {/* New Transaction Creation Modal */}
      <NewTransactionModal
        isOpen={isNewTxnModalOpen}
        onClose={() => setIsNewTxnModalOpen(false)}
        onCreated={handleTransactionCreated}
      />
    </div>
  );
};
