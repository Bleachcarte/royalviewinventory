import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Home, 
  Package, 
  Users, 
  Settings, 
  LogOut, 
  BarChart3,
  Search,
  Bell,
  Menu,
  X
} from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, onViewChange }) => {
  const { user, logout, hasPermission } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { notifications, markAllRead, removeNotification } = useNotifications();
  const [showNotif, setShowNotif] = useState(false);

  const navigationItems = [
    { id: 'inventory', label: 'Inventory', icon: Package, show: true },
    { id: 'users', label: 'Users', icon: Users, show: hasPermission('manage_users') },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu button */}
      <div className="lg:hidden">
        <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold">Inventory System</h1>
            <div className="w-10" />
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Inventory</h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {navigationItems.map((item) => {
                if (!item.show) return null;
                
                const Icon = item.icon;
                const isActive = currentView === item.id;
                
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        onViewChange(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 border border-blue-200'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User section */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">
                  {user?.name?.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 mt-16 lg:mt-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 capitalize">
                {currentView === 'dashboard' ? 'Dashboard' : 
                 currentView === 'inventory' ? 'Inventory Management' :
                 currentView === 'users' ? 'User Management' : currentView}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {currentView === 'dashboard' ? 'Overview of your inventory system' :
                 currentView === 'inventory' ? 'Manage your inventory items and stock levels' :
                 currentView === 'users' ? 'Manage user accounts and permissions' : ''}
              </p>
            </div>
            <div className="flex items-center space-x-4 relative">
              <button
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => { setShowNotif(v => !v); markAllRead(); }}
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
              {showNotif && notifications.length > 0 && (
                <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-lg z-50 p-4">
                  <h4 className="font-bold mb-2">Notifications</h4>
                  <ul className="space-y-2 max-h-60 overflow-y-auto">
                    {notifications.map(n => (
                      <li key={n.id} className="text-sm flex items-start justify-between gap-2 group">
                        <div>
                          <span className="font-medium">{n.message}</span>
                          <span className="block text-xs text-gray-400">{n.timestamp.toLocaleString()}</span>
                        </div>
                        <button
                          className="text-gray-400 hover:text-red-600 p-1 rounded group-hover:visible"
                          onClick={() => removeNotification(n.id)}
                          aria-label="Dismiss notification"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
        <footer className="w-full text-center py-4 text-gray-500 border-t border-gray-200 bg-white">
          2025 Royal View Services Ltd.
        </footer>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;