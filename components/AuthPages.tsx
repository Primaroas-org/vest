import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { ViewState } from '../types';

interface AuthPageProps {
  onNavigate: (view: ViewState) => void;
}

export const Login: React.FC<AuthPageProps> = ({ onNavigate }) => {
  const { dict } = useLanguage();
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login();
    onNavigate('dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark py-20 px-4 relative overflow-hidden">
       {/* Background Decoration */}
       <div className="absolute top-0 left-0 w-full h-full hero-gradient opacity-10 pointer-events-none"></div>
       <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
       <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>

      <div className="bg-white dark:bg-charcoal p-8 md:p-12 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex bg-primary p-3 rounded-xl mb-6 shadow-lg shadow-primary/20">
            <span className="material-icons-round text-white text-3xl">apartment</span>
          </div>
          <h2 className="text-3xl font-extrabold text-charcoal dark:text-white font-display mb-2">{dict.auth.welcomeBack}</h2>
          <p className="text-gray-500 dark:text-gray-400">{dict.auth.enterDetails}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{dict.auth.email}</label>
            <div className="relative">
              <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">email</span>
              <input 
                type="email" 
                required
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
                placeholder="name@example.com"
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">{dict.auth.password}</label>
              <button type="button" className="text-xs font-bold text-primary hover:text-emerald-600 transition-colors">{dict.auth.forgotPassword}</button>
            </div>
            <div className="relative">
              <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">lock</span>
              <input 
                type="password" 
                required
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button className="w-full bg-primary hover:bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary/25 transition-all active:scale-95">
            {dict.auth.signIn}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800">
          <button className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-charcoal dark:text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
            {dict.auth.continueGoogle}
          </button>
          
          <p className="text-center mt-6 text-gray-500 dark:text-gray-400 text-sm">
            {dict.auth.noAccount} {' '}
            <button onClick={() => onNavigate('signup')} className="text-primary font-bold hover:underline">
              {dict.auth.signUp}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export const Signup: React.FC<AuthPageProps> = ({ onNavigate }) => {
  const { dict } = useLanguage();
  const { register } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register();
    onNavigate('dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark py-20 px-4 relative overflow-hidden">
        {/* Background Decoration */}
       <div className="absolute top-0 left-0 w-full h-full hero-gradient opacity-10 pointer-events-none"></div>
       <div className="absolute top-24 -left-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
       <div className="absolute bottom-24 -right-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>

      <div className="bg-white dark:bg-charcoal p-8 md:p-12 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-charcoal dark:text-white font-display mb-2">{dict.auth.createAccount}</h2>
          <p className="text-gray-500 dark:text-gray-400">{dict.auth.joinCommunity}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{dict.auth.name}</label>
            <input 
              type="text" 
              className="w-full px-4 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{dict.auth.email}</label>
            <input 
              type="email" 
              className="w-full px-4 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
              placeholder="name@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{dict.auth.password}</label>
            <input 
              type="password" 
              className="w-full px-4 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
              placeholder="••••••••"
            />
          </div>

          <button className="w-full bg-primary hover:bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary/25 transition-all active:scale-95">
            {dict.auth.signUp}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-6 leading-relaxed">
          {dict.auth.bySigning}
        </p>

        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {dict.auth.haveAccount} {' '}
            <button onClick={() => onNavigate('login')} className="text-primary font-bold hover:underline">
              {dict.auth.signIn}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};