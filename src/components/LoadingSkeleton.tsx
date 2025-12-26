import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'rectangular' | 'circular';
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  className = '',
  width,
  height,
  variant = 'text',
  animation = 'pulse',
}: SkeletonProps) {
  const variantClasses = {
    text: 'rounded',
    rectangular: 'rounded-md',
    circular: 'rounded-full',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`bg-gray-200 dark:bg-gray-700 ${variantClasses[variant]} ${animationClasses[animation]} ${className} transition-colors duration-200`}
      style={style}
      aria-hidden="true"
      role="presentation"
    />
  );
}

// Card skeleton for dashboard cards
export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-100 dark:border-gray-700 transition-colors duration-200">
      <div className="space-y-3">
        <Skeleton width="40%" height={20} variant="text" />
        <Skeleton width="80%" height={28} variant="text" />
        <Skeleton width="60%" height={16} variant="text" />
      </div>
    </div>
  );
}

// Transaction table skeleton
export function TransactionTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden transition-colors duration-200">
      <div className="border-b border-gray-200">
        <div className="grid grid-cols-5 gap-4 p-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} height={20} variant="text" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="grid grid-cols-5 gap-4 p-4">
            <Skeleton height={20} variant="text" />
            <Skeleton height={20} variant="text" />
            <Skeleton height={20} variant="text" />
            <Skeleton height={20} variant="text" />
            <Skeleton height={20} variant="text" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Chart skeleton
export function ChartSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-100 dark:border-gray-700 transition-colors duration-200">
      <Skeleton width="30%" height={24} variant="text" className="mb-4" />
      <div className="h-64 relative">
        <div className="absolute inset-0 flex items-end justify-between space-x-1">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton
              key={i}
              width="100%"
              height={`${Math.random() * 80 + 20}%`}
              variant="rectangular"
              className="flex-1"
            />
          ))}
        </div>
      </div>
      <div className="flex justify-between mt-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} width={40} height={16} variant="text" />
        ))}
      </div>
    </div>
  );
}

// Wallet skeleton
export function WalletSkeleton() {
  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Skeleton width={40} height={40} variant="circular" />
          <div className="space-y-2">
            <Skeleton width={120} height={16} variant="text" />
            <Skeleton width={80} height={14} variant="text" />
            <Skeleton width={60} height={12} variant="text" />
          </div>
        </div>
        <Skeleton width={100} height={36} variant="rectangular" />
      </div>
    </div>
  );
}

// Stats cards skeleton
export function StatsCardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-${count} gap-4`}>
      {Array.from({ length: count }).map((_, index) => (
        <CardSkeleton key={index} />
      ))}
    </div>
  );
}

// Navigation skeleton
export function NavigationSkeleton() {
  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Skeleton width={200} height={32} variant="rectangular" />
            <div className="hidden md:flex space-x-1">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} width={80} height={36} variant="rectangular" className="rounded-md" />
              ))}
            </div>
          </div>
          <WalletSkeleton />
        </div>
      </div>
    </nav>
  );
}

// Page skeleton
export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <NavigationSkeleton />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton width="40%" height={36} variant="text" />
            <Skeleton width="60%" height={20} variant="text" />
          </div>
          <StatsCardsSkeleton count={3} />
          <ChartSkeleton />
          <TransactionTableSkeleton rows={5} />
        </div>
      </main>
    </div>
  );
}

// Form skeleton
export function FormSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-100 dark:border-gray-700 transition-colors duration-200">
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton width="30%" height={16} variant="text" />
          <Skeleton height={44} variant="rectangular" />
        </div>
        <div className="space-y-2">
          <Skeleton width="25%" height={16} variant="text" />
          <Skeleton height={44} variant="rectangular" />
        </div>
        <div className="space-y-2">
          <Skeleton width="35%" height={16} variant="text" />
          <Skeleton height={44} variant="rectangular" />
        </div>
        <Skeleton height={48} width="100%" variant="rectangular" />
      </div>
    </div>
  );
}

// List skeleton
export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-100 dark:border-gray-700 transition-colors duration-200">
          <div className="flex items-center space-x-3">
            <Skeleton width={40} height={40} variant="circular" />
            <div className="flex-1 space-y-2">
              <Skeleton width="60%" height={16} variant="text" />
              <Skeleton width="40%" height={14} variant="text" />
            </div>
            <Skeleton width={80} height={32} variant="rectangular" />
          </div>
        </div>
      ))}
    </div>
  );
}