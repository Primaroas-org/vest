import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export const FilterBar: React.FC = () => {
  const { dict } = useLanguage();

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
      <div className="bg-white dark:bg-charcoal p-6 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 transition-colors duration-300">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-grow relative group">
            <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
              search
            </span>
            <input
              type="text"
              className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder-gray-400"
              placeholder={dict.filter.searchPlaceholder}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <select className="rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white font-medium py-3 px-4 focus:ring-2 focus:ring-primary outline-none transition-all appearance-none cursor-pointer hover:border-primary/50">
              <option>{dict.filter.propertyType}</option>
              <option>{dict.filter.residential}</option>
              <option>{dict.filter.commercial}</option>
            </select>
            <select className="rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white font-medium py-3 px-4 focus:ring-2 focus:ring-primary outline-none transition-all appearance-none cursor-pointer hover:border-primary/50">
              <option>{dict.filter.expectedYield}</option>
              <option>5% - 8%</option>
              <option>8% - 12%</option>
            </select>
            <button className="bg-primary text-white px-8 py-4 rounded-xl font-bold hover:bg-emerald-600 transition-colors flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95">
              <span className="material-icons-round">tune</span>
              {dict.filter.apply}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};