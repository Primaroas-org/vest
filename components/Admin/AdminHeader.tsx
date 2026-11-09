import React from 'react';
import { Bell } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface AdminHeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ currentView, onNavigate }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', path: '/admin' },
    { id: 'properties', label: 'Properties', path: '/admin/properties' },
    { id: 'investors', label: 'Investors', path: '/admin/investors' },
    { id: 'transactions', label: 'Transactions', path: '/admin/transactions' },
    { id: 'kyc', label: 'KYC', path: '/admin/kyc' },
    { id: 'dividends', label: 'Dividends', path: '/admin/dividends' },
  ];
  
  const getCurrentView = () => {
    const path = location.pathname;
    if (path.includes('/properties')) return 'properties';
    if (path.includes('/investors')) return 'investors';
    if (path.includes('/transactions')) return 'transactions';
    if (path.includes('/kyc')) return 'kyc';
    return 'dashboard';
  };
  
  const activeView = getCurrentView();

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md px-4 lg:px-10 py-3">
      <div className="flex items-center gap-8">
        <div 
          className="flex items-center gap-4 text-charcoal dark:text-white cursor-pointer group" 
          onClick={() => navigate('/admin')}
        >
          <div className="size-6 text-primary group-hover:scale-110 transition-transform">
            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path clipRule="evenodd" d="M12.0799 24L4 19.2479L9.95537 8.75216L18.04 13.4961L18.0446 4H29.9554L29.96 13.4961L38.0446 8.75216L44 19.2479L35.92 24L44 28.7521L38.0446 39.2479L29.96 34.5039L29.9554 44H18.0446L18.04 34.5039L9.95537 39.2479L4 28.7521L12.0799 24Z" fill="currentColor" fillRule="evenodd"></path>
            </svg>
          </div>
          <h2 className="text-charcoal dark:text-white text-lg font-bold leading-tight tracking-tight">Admin Portal</h2>
        </div>
        <nav className="hidden md:flex items-center gap-6 border-l border-gray-200 dark:border-gray-700 pl-8">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                activeView === item.id
                  ? 'text-primary font-bold border-b-2 border-primary py-1'
                  : 'text-charcoal dark:text-gray-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/')}
          className="text-sm font-bold text-charcoal dark:text-gray-300 hover:text-primary transition-colors"
        >
          Back to Site
        </button>
        <button className="flex items-center justify-center p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors relative">
          <Bell className="text-gray-600 dark:text-gray-400 size-5" />
          <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border border-white"></span>
        </button>
        <div className="size-10 rounded-full bg-gray-200 dark:bg-gray-700 ring-2 ring-primary/20 overflow-hidden cursor-pointer hover:ring-primary transition-all">
          <img src="https://ui-avatars.com/api/?name=Admin+User&background=10b981&color=ffffff" alt="Profile" className="w-full h-full object-cover" />
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
