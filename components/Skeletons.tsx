import React from 'react';

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white dark:bg-gray-800 p-7 rounded-[2rem] shadow-lg border border-gray-200 dark:border-gray-700 animate-pulse ${className}`}>
    <div className="flex justify-between items-start mb-6">
      <div className="size-12 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
      <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
    </div>
    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
  </div>
);

export const SkeletonTable: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
    <div className="p-8 border-b border-gray-100 dark:border-gray-700">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
    </div>
    <div className="p-8 space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonPropertyCard: React.FC = () => (
  <div className="bg-white dark:bg-charcoal rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 animate-pulse">
    <div className="h-64 bg-gray-200 dark:bg-gray-700"></div>
    <div className="p-6 space-y-4">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="flex gap-4">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
      </div>
      <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
    </div>
  </div>
);

export const SkeletonGraph: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 p-10 rounded-[2.5rem] shadow-lg border border-gray-200 dark:border-gray-700 animate-pulse">
    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4"></div>
    <div className="h-72 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
  </div>
);

export const SkeletonList: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
      </div>
    ))}
  </div>
);

export const SkeletonGrid: React.FC<{ cols?: number }> = ({ cols = 3 }) => (
  <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${cols} gap-6`}>
    {Array.from({ length: cols }).map((_, i) => (
      <div key={i} className="bg-gray-50 dark:bg-gray-700 p-6 rounded-2xl animate-pulse">
        <div className="aspect-video bg-gray-200 dark:bg-gray-600 rounded-xl mb-4"></div>
        <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mb-4"></div>
        <div className="flex justify-between">
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ lines = 3, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className={`h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
      ></div>
    ))}
  </div>
);
