import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { GoogleSheetsInventoryProvider } from './contexts/GoogleSheetsContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Layout from './components/Layout/Layout';
import LoginForm from './components/Auth/LoginForm';
import Dashboard from './components/Dashboard/Dashboard';
import InventoryTable from './components/Inventory/InventoryTable';
import UserManagement from './components/Users/UserManagement';

const AppContent: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const [currentView, setCurrentView] = useState('inventory'); // default to inventory

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'inventory':
        return <InventoryTable />;
      case 'users':
        return <UserManagement />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentView={currentView} onViewChange={setCurrentView}>
      {renderCurrentView()}
    </Layout>
  );
};

function App() {
  return (
    <NotificationProvider>
    <AuthProvider>
      <GoogleSheetsInventoryProvider>
        <AppContent />
      </GoogleSheetsInventoryProvider>
    </AuthProvider>
    </NotificationProvider>
  );
}

export default App;