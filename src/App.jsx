import React, { useState, useEffect } from 'react';
import { api } from './api';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import SalesModule from './components/SalesModule';
import Inventory from './components/Inventory';
import PurchaseModule from './components/PurchaseModule';
import Suppliers from './components/Suppliers';
import Udhari from './components/Udhari';
import Expenses from './components/Expenses';
import Shops from './components/Shops';
import Users from './components/Users';
import Reports from './components/Reports';
import Settings from './components/Settings';

export default function App() {
  const [user, setUser] = useState(null);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [shops, setShops] = useState([]);
  const [initialized, setInitialized] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  // Sync Theme with DOM
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Check Session on boot
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
    setInitialized(true);
  }, []);

  // Fetch Shops list once authenticated
  const fetchShopsList = async () => {
    try {
      const data = await api.get('/shops');
      setShops(data);
    } catch (err) {
      console.error('Failed to pre-fetch shops database:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchShopsList();
    }
  }, [user]);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setCurrentTab('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setShops([]);
    setCurrentTab('dashboard');
  };

  if (!initialized) {
    return (
      <div className="min-h-screen bg-brand-darkBg flex items-center justify-center text-xs text-brand-textMuted">
        Initializing ERP Shell...
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Render content depending on active tab with permission checks
  const renderTabContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard setCurrentTab={setCurrentTab} user={user} shops={shops} />;
      case 'sales':
        return <SalesModule user={user} shops={shops} />;
      case 'inventory':
        return <Inventory user={user} shops={shops} />;
      
      // Managers & Admins only
      case 'purchase':
        if (user.role === 'Staff') return <Dashboard setCurrentTab={setCurrentTab} user={user} shops={shops} />;
        return <PurchaseModule user={user} shops={shops} />;
      case 'suppliers':
        if (user.role === 'Staff') return <Dashboard setCurrentTab={setCurrentTab} user={user} shops={shops} />;
        return <Suppliers user={user} shops={shops} />;
      case 'expenses':
        if (user.role === 'Staff') return <Dashboard setCurrentTab={setCurrentTab} user={user} shops={shops} />;
        return <Expenses user={user} shops={shops} />;
      case 'reports':
        if (user.role === 'Staff') return <Dashboard setCurrentTab={setCurrentTab} user={user} shops={shops} />;
        return <Reports user={user} shops={shops} />;

      // Admin only
      case 'shops':
        if (user.role !== 'Admin') return <Dashboard setCurrentTab={setCurrentTab} user={user} shops={shops} />;
        return <Shops shops={shops} setShops={setShops} />;
      case 'users':
        if (user.role !== 'Admin') return <Dashboard setCurrentTab={setCurrentTab} user={user} shops={shops} />;
        return <Users shops={shops} />;
      
      case 'udhari':
        return <Udhari user={user} shops={shops} />;
      case 'settings':
        return <Settings user={user} />;
      default:
        return <Dashboard setCurrentTab={setCurrentTab} user={user} shops={shops} />;
    }
  };

  return (
    <div className="min-h-screen bg-brand-darkBg flex flex-col lg:flex-row">
      
      {/* Sidebar navigation shell */}
      <Sidebar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        user={user} 
        onLogout={handleLogout} 
        theme={theme}
        setTheme={setTheme}
      />

      {/* Main dashboard viewport panel */}
      <main className="flex-1 p-4 lg:p-8 pt-20 lg:pt-8 max-w-7xl mx-auto w-full overflow-hidden">
        {renderTabContent()}
      </main>

    </div>
  );
}
