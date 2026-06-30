import React from 'react';
import { 
  LayoutDashboard, Store, Package, ShoppingCart, 
  Banknote, Handshake, BookOpen, ArrowDownRight, 
  BarChart3, Users, Settings, LogOut, Menu, X, Sun, Moon
} from 'lucide-react';

export default function Sidebar({ currentTab, setCurrentTab, user, onLogout, theme, setTheme }) {
  const [isOpen, setIsOpen] = React.useState(false);

  const allItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Shop Manager', 'Staff'] },
    { id: 'sales', label: 'Sales Entry', icon: Banknote, roles: ['Admin', 'Shop Manager', 'Staff'] },
    { id: 'inventory', label: 'Inventory', icon: Package, roles: ['Admin', 'Shop Manager', 'Staff'] },
    { id: 'purchase', label: 'Purchase Entry', icon: ShoppingCart, roles: ['Admin', 'Shop Manager'] },
    { id: 'suppliers', label: 'Suppliers', icon: Handshake, roles: ['Admin', 'Shop Manager'] },
    { id: 'udhari', label: 'Udhari Ledger', icon: BookOpen, roles: ['Admin', 'Shop Manager', 'Staff'] },
    { id: 'expenses', label: 'Expenses', icon: ArrowDownRight, roles: ['Admin', 'Shop Manager'] },
    { id: 'shops', label: 'Shops', icon: Store, roles: ['Admin'] },
    { id: 'reports', label: 'Reports', icon: BarChart3, roles: ['Admin', 'Shop Manager'] },
    { id: 'users', label: 'Users', icon: Users, roles: ['Admin'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['Admin', 'Shop Manager', 'Staff'] },
  ];

  const allowedItems = allItems.filter(item => item.roles.includes(user?.role));

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden w-full bg-brand-panelBg border-b border-brand-border h-16 flex items-center justify-between px-4 z-40 fixed top-0 left-0">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center font-bold text-white tracking-widest text-sm">LQ</div>
          <span className="font-semibold text-lg bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Antigravity Liquor ERP</span>
        </div>
        <button onClick={toggleSidebar} className="text-gray-400 hover:text-white focus:outline-none">
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Core */}
      <aside className={`
        fixed top-0 bottom-0 left-0 w-64 glass-panel border-r border-brand-border z-50 flex flex-col transition-transform duration-300
        lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:static'}
        h-screen pt-16 lg:pt-0
      `}>
        {/* Logo / Title */}
        <div className="hidden lg:flex items-center space-x-3 px-6 py-6 border-b border-brand-border">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white tracking-widest shadow-lg shadow-blue-500/20">LQ</div>
          <div>
            <h1 className="font-bold text-base text-gray-100 tracking-wide glow-accent">LIQUOR ERP</h1>
            <p className="text-[10px] text-brand-textMuted tracking-wider font-semibold uppercase">Business Suite</p>
          </div>
        </div>

        {/* User Card */}
        <div className="px-4 py-4 border-b border-brand-border bg-brand-darkBg/30">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold border border-brand-border">
              {user?.username?.substring(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-sm font-semibold text-gray-200 truncate">{user?.username}</h4>
              <p className="text-xs text-brand-textMuted truncate">{user?.role} • <span className="text-blue-400">{user?.shop_name}</span></p>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {allowedItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setIsOpen(false);
                }}
                className={`
                  w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150
                  ${isActive 
                    ? 'bg-blue-600/20 border border-blue-500/30 text-blue-400 font-semibold' 
                    : 'text-brand-textMuted hover:bg-brand-panelBg hover:text-brand-textActive'}
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'text-brand-textMuted'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Theme Toggle */}
        <div className="px-4 py-3 border-t border-brand-border flex items-center justify-between text-xs font-semibold text-brand-textMuted">
          <span>Theme Mode:</span>
          <div className="bg-brand-darkBg/50 border border-brand-border p-0.5 rounded-lg flex space-x-1">
            <button
              onClick={() => setTheme('light')}
              className={`p-1.5 rounded-md transition ${theme === 'light' ? 'bg-blue-600 text-white' : 'hover:text-brand-textActive'}`}
              title="Light Theme"
            >
              <Sun className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`p-1.5 rounded-md transition ${theme === 'dark' ? 'bg-blue-600 text-white' : 'hover:text-brand-textActive'}`}
              title="Dark Theme"
            >
              <Moon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Logout Button */}
        <div className="p-3 border-t border-brand-border">
          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-950/20 hover:border-red-900/30 border border-transparent transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          onClick={toggleSidebar} 
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
        />
      )}
    </>
  );
}
