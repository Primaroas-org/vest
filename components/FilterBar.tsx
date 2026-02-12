import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export interface FilterState {
  searchQuery: string;
  propertyType: string; // '' = all, 'residential', 'commercial'
  yieldRange: string;   // '' = all, '5-8', '8-12'
}

interface FilterBarProps {
  onFilterChange: (filters: FilterState) => void;
  filters: FilterState;
}

export const FilterBar: React.FC<FilterBarProps> = ({ onFilterChange, filters }) => {
  const { dict } = useLanguage();
  const [localSearch, setLocalSearch] = useState(filters.searchQuery);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  // Use refs to avoid stale closure in debounce
  const filtersRef = useRef(filters);
  const onFilterChangeRef = useRef(onFilterChange);
  filtersRef.current = filters;
  onFilterChangeRef.current = onFilterChange;

  // Debounce search input to avoid filtering on every keystroke
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      if (localSearch !== filtersRef.current.searchQuery) {
        onFilterChangeRef.current({ ...filtersRef.current, searchQuery: localSearch });
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [localSearch]);

  const handleTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, propertyType: e.target.value });
  }, [filters, onFilterChange]);

  const handleYieldChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, yieldRange: e.target.value });
  }, [filters, onFilterChange]);

  const handleClearFilters = useCallback(() => {
    setLocalSearch('');
    onFilterChange({ searchQuery: '', propertyType: '', yieldRange: '' });
  }, [onFilterChange]);

  const hasActiveFilters = filters.searchQuery || filters.propertyType || filters.yieldRange;

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
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder-gray-400"
              placeholder={dict.filter.searchPlaceholder}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={filters.propertyType}
              onChange={handleTypeChange}
              className="rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white font-medium py-3 px-4 focus:ring-2 focus:ring-primary outline-none transition-all appearance-none cursor-pointer hover:border-primary/50"
            >
              <option value="">{dict.filter.propertyType}</option>
              <option value="Residential">{dict.filter.residential}</option>
              <option value="Commercial">{dict.filter.commercial}</option>
            </select>
            <select
              value={filters.yieldRange}
              onChange={handleYieldChange}
              className="rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white font-medium py-3 px-4 focus:ring-2 focus:ring-primary outline-none transition-all appearance-none cursor-pointer hover:border-primary/50"
            >
              <option value="">{dict.filter.expectedYield}</option>
              <option value="5-8">5% - 8%</option>
              <option value="8-12">8% - 12%</option>
              <option value="12+">12%+</option>
            </select>
            {hasActiveFilters ? (
              <button
                onClick={handleClearFilters}
                className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-4 rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-2 active:scale-95"
              >
                <span className="material-icons-round text-sm">close</span>
                Clear
              </button>
            ) : (
              <button className="bg-primary text-white px-8 py-4 rounded-xl font-bold hover:bg-emerald-600 transition-colors flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95">
                <span className="material-icons-round">tune</span>
                {dict.filter.apply}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};