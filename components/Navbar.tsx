import React, { useState, useEffect } from 'react';
import { NavLink, ViewState } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth, SESSION_TIMEOUT_MS } from '../contexts/AuthContext';

interface NavbarProps {
  onNavigate: (view: ViewState) => void;
  currentView: ViewState;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentView }) => {
  const { dict, language, setLanguage } = useLanguage();
  const { user, isAuthenticated, logout, resetSessionTimeout, getLastActivityTime } = useAuth();
  
  // Local countdown state - only re-renders the Navbar, not the entire app
  const [sessionTimeout, setSessionTimeout] = useState<number | null>(null);

  useEffect(() => {
    if (!user) {
      setSessionTimeout(null);
      return;
    }

    const updateCountdown = () => {
      const elapsed = Date.now() - getLastActivityTime();
      const remaining = Math.max(0, SESSION_TIMEOUT_MS - elapsed);
      setSessionTimeout(Math.ceil(remaining / 1000));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [user, getLastActivityTime]);

  const navLinks: NavLink[] = [
    { label: dict.nav.marketplace, id: 'marketplace', isActive: currentView === 'marketplace' || currentView === 'property-details' },
    { label: dict.nav.howItWorks, id: 'how-it-works', isActive: currentView === 'how-it-works' },
    { label: dict.nav.resources, id: 'resources', isActive: currentView === 'resources' },
    { label: dict.nav.about, id: 'about', isActive: currentView === 'about' },
  ];

  return (
    <header className="sticky top-0 z-50 glass-header border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('marketplace')}>
            <div className="bg-primary p-2 rounded-lg">
              <span className="material-icons-round text-white">apartment</span>
            </div>
            <span className="text-2xl font-extrabold tracking-tight font-display text-charcoal dark:text-white">
              {dict.brandName}
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8 font-medium">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => onNavigate(link.id as ViewState)}
                className={`transition-colors ${link.isActive
                    ? 'text-primary'
                    : 'text-gray-600 dark:text-gray-300 hover:text-primary'
                  }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* User Actions */}
          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === 'mn' ? 'en' : 'mn')}
              className="px-2 py-1 text-xs font-bold border border-gray-300 dark:border-gray-600 rounded uppercase text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {language}
            </button>

            {isAuthenticated && user ? (
              <>
                {/* Session Timeout Indicator */}
                {sessionTimeout !== null && (
                  <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <span className="material-icons-round text-sm text-gray-500 dark:text-gray-400">
                      timer
                    </span>
                    <span className={`text-xs font-semibold ${
                      sessionTimeout <= 60 
                        ? 'text-red-500 dark:text-red-400' 
                        : sessionTimeout <= 120 
                        ? 'text-orange-500 dark:text-orange-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {Math.floor(sessionTimeout / 60)}:{(sessionTimeout % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                )}
                <div className="hidden lg:flex flex-col items-end mr-4">
                  <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                    {dict.nav.walletLabel}
                  </span>
                  <span className="text-sm font-bold font-display text-charcoal dark:text-white">
                    ₮ {user.balance.toLocaleString()}
                  </span>
                </div>
                <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <span className="material-icons-round text-gray-500">
                    notifications
                  </span>
                </button>
                <button
                  onClick={() => {
                    resetSessionTimeout();
                    onNavigate('dashboard');
                  }}
                  className="bg-charcoal dark:bg-white dark:text-charcoal text-white px-5 py-2.5 rounded-full font-semibold text-sm transition-transform hover:scale-105 active:scale-95"
                >
                  {dict.nav.portfolio}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onNavigate('login')}
                  className="hidden sm:block text-gray-600 dark:text-gray-300 hover:text-primary font-bold transition-colors"
                >
                  {dict.nav.login}
                </button>
                <button
                  onClick={() => onNavigate('signup')}
                  className="bg-primary text-white px-5 py-2.5 rounded-full font-semibold text-sm transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
                >
                  {dict.nav.signup}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};