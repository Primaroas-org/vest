import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export const StatsSection: React.FC = () => {
  const { dict } = useLanguage();

  const stats = [
    { value: '₮ 42B+', label: dict.stats.assets },
    { value: '12,400+', label: dict.stats.investors },
    { value: '14.2%', label: dict.stats.return },
    { value: '100%', label: dict.stats.vetted },
  ];

  return (
    <section className="bg-charcoal dark:bg-charcoal-darker py-20 text-white transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-gray-700/50">
          {stats.map((stat, index) => (
            <div key={index} className="pt-8 md:pt-0 hover:transform hover:scale-105 transition-transform duration-300">
              <p className="text-4xl font-extrabold text-primary mb-2 font-display">
                {stat.value}
              </p>
              <p className="text-gray-400 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};