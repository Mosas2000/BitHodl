import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  illustration?: string;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  illustration,
  className = '',
}: EmptyStateProps) {
  const actionClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
  };

  return (
    <div
      className={`text-center py-12 px-4 ${className} animate-fade-in`}
      role="status"
      aria-live="polite"
    >
      {illustration ? (
        <div className="text-6xl mb-4 animate-pulse-slow" role="img" aria-label={title}>{illustration}</div>
      ) : icon ? (
        <div className="flex justify-center mb-4">{icon}</div>
      ) : (
        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center transition-colors duration-200">
          <svg className="w-10 h-10 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
      )}
      
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto transition-colors duration-200">{description}</p>
      
      {action && (
        <button
          onClick={action.onClick}
          className={`${actionClasses[action.variant || 'primary']} px-6 py-3 transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900`}
          aria-label={action.label}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// Specific empty state for no savings plan
export function NoSavingsPlanEmptyState({ onCreatePlan }: { onCreatePlan: () => void }) {
  return (
    <EmptyState
      illustration="🎯"
      title="No Savings Plan Yet"
      description="Start your Bitcoin savings journey with BitHodl by creating a personalized savings plan that fits your goals."
      action={{
        label: 'Create Savings Plan',
        onClick: onCreatePlan,
        variant: 'primary',
      }}
      className="bg-white rounded-lg shadow-sm border border-gray-100"
    />
  );
}

// Empty state for no transactions
export function NoTransactionsEmptyState({ onDeposit }: { onDeposit: () => void }) {
  return (
    <EmptyState
      illustration="📭"
      title="No Transactions Yet"
      description="You haven't made any transactions yet with BitHodl. Start by depositing STX to your savings account."
      action={{
        label: 'Make Your First Deposit',
        onClick: onDeposit,
        variant: 'primary',
      }}
      className="bg-white rounded-lg shadow-sm border border-gray-100"
    />
  );
}

// Empty state for no search results
export function NoSearchResultsEmptyState({ onClearSearch }: { onClearSearch: () => void }) {
  return (
    <EmptyState
      illustration="🔍"
      title="No Results Found"
      description="BitHodl couldn't find any transactions matching your search criteria. Try adjusting your filters or search terms."
      action={{
        label: 'Clear Search',
        onClick: onClearSearch,
        variant: 'secondary',
      }}
      className="bg-white rounded-lg shadow-sm border border-gray-100"
    />
  );
}

// Empty state for wallet not connected
export function WalletNotConnectedEmptyState({ onConnect }: { onConnect: () => void }) {
  return (
    <EmptyState
      icon={
        <div className="w-20 h-20 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
          <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
      }
      title="Connect Your Wallet"
      description="Connect your Stacks wallet to use BitHodl and start saving Bitcoin while earning interest on your STX tokens."
      action={{
        label: 'Connect Wallet',
        onClick: onConnect,
        variant: 'primary',
      }}
      className="bg-white rounded-lg shadow-sm border border-gray-100"
    />
  );
}

// Empty state for no DCA purchases
export function NoDCAPurchasesEmptyState({ onCreatePlan }: { onCreatePlan: () => void }) {
  return (
    <EmptyState
      illustration="📈"
      title="No DCA Purchases Yet"
      description="Start dollar-cost averaging Bitcoin with BitHodl by setting up automatic purchases at regular intervals."
      action={{
        label: 'Create DCA Plan',
        onClick: onCreatePlan,
        variant: 'primary',
      }}
      className="bg-white rounded-lg shadow-sm border border-gray-100"
    />
  );
}

// Empty state for no data in charts
export function NoChartDataEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
      <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <p className="text-sm">No data available for the selected period</p>
    </div>
  );
}

// Empty state for no filters applied
export function NoFiltersAppliedEmptyState({ onApplyFilters }: { onApplyFilters: () => void }) {
  return (
    <EmptyState
      illustration="⚙️"
      title="No Filters Applied"
      description="Apply filters to narrow down your transactions and find exactly what you're looking for."
      action={{
        label: 'Apply Filters',
        onClick: onApplyFilters,
        variant: 'secondary',
      }}
      className="bg-white rounded-lg shadow-sm border border-gray-100"
    />
  );
}

// Empty state for page not found
export function NotFoundEmptyState({ onGoHome }: { onGoHome: () => void }) {
  return (
    <EmptyState
      illustration="🤷"
      title="Page Not Found"
      description="The BitHodl page you're looking for doesn't exist or has been moved."
      action={{
        label: 'Go Home',
        onClick: onGoHome,
        variant: 'primary',
      }}
      className="min-h-screen flex items-center justify-center"
    />
  );
}

// Empty state for network error
export function NetworkErrorEmptyState({ onRetry }: { onRetry: () => void }) {
  return (
    <EmptyState
      icon={
        <div className="w-20 h-20 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
          <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      }
      title="Connection Error"
      description="We couldn't connect to the Stacks network. Please check your internet connection and try again."
      action={{
        label: 'Try Again',
        onClick: onRetry,
        variant: 'primary',
      }}
      className="bg-white rounded-lg shadow-sm border border-gray-100"
    />
  );
}