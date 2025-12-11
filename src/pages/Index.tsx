import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { BusProvider } from '@/contexts/BusContext';
import AuthPage from '@/components/AuthPage';
import Dashboard from '@/components/Dashboard';

const Index = () => {
  const { isAuthenticated } = useAuth();
  const [showDashboard, setShowDashboard] = useState(false);

  if (!isAuthenticated && !showDashboard) {
    return <AuthPage onSuccess={() => setShowDashboard(true)} />;
  }

  return (
    <BusProvider>
      <Dashboard />
    </BusProvider>
  );
};

export default Index;
