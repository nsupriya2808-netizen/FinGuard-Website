/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User } from './types';
import { api } from './api/client';
import { AppLayout } from './components/layout/AppLayout';
import { LoginRegisterView } from './components/auth/LoginRegisterView';
import { RefreshCw } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user has an active session
    api
      .getMe()
      .then((res) => {
        if (res.user) {
          setCurrentUser(res.user);
        }
      })
      .catch(() => {
        // Not logged in or expired token
        setCurrentUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mb-3" />
        <span className="text-sm font-semibold tracking-wider font-mono uppercase">
          Initializing FinGuard Security Terminal...
        </span>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginRegisterView onAuthSuccess={handleAuthSuccess} />;
  }

  return <AppLayout currentUser={currentUser} onLogout={handleLogout} />;
}
