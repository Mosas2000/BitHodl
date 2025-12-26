import { useState } from 'react';
import { microSTXToSTX, formatSTX } from '@/utils/stacks';
import { ContractState, StacksUser } from '@/types';
import { SavingsPlanCreator } from '@/components/SavingsPlanCreator';
import { CardSkeleton, ChartSkeleton } from '@/components/LoadingSkeleton';
import { NoSavingsPlanEmptyState } from '@/components/EmptyState';

interface MainDashboardProps {
  contractState: ContractState;
  isBalanceLoading?: boolean;
  user: StacksUser | null;
}

interface SavingsPlan {
  amountPerPurchase: number;
  frequency: string;
  nextPurchaseDate: Date;
  isActive: boolean;
}

export function MainDashboard({ contractState, user }: MainDashboardProps) {
  const [showSavingsPlanCreator, setShowSavingsPlanCreator] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Mock savings plan data
  const [savingsPlan, setSavingsPlan] = useState<SavingsPlan | null>({
    amountPerPurchase: 0.1, // 0.1 sBTC per purchase
    frequency: 'Weekly',
    nextPurchaseDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    isActive: true,
  });
  
  // Simulate loading
  useState(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  });

  // Mock chart data for savings growth over time
  const chartData = [
    { date: 'Jan 1', value: 0.5 },
    { date: 'Jan 15', value: 0.6 },
    { date: 'Feb 1', value: 0.7 },
    { date: 'Feb 15', value: 0.8 },
    { date: 'Mar 1', value: 0.9 },
    { date: 'Mar 15', value: 1.0 },
    { date: 'Apr 1', value: 1.1 },
    { date: 'Apr 15', value: 1.2 },
  ];

  // Calculate values
  const totalSavedSTX = microSTXToSTX(contractState.userBalance);
  const sBTCtoUSD = 45000; // Mock conversion rate for sBTC to USD
  const totalSavedUSD = totalSavedSTX * sBTCtoUSD;

  // Mock stats
  const totalDeposits = microSTXToSTX(contractState.userDeposit?.amount || 0);
  const totalWithdrawn = 0; // Mock data
  const averagePurchasePrice = 44500; // Mock data in USD

  const toggleSavingsPlan = () => {
    setSavingsPlan(prev => {
      if (!prev) return null;
      return { ...prev, isActive: !prev.isActive };
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <CardSkeleton />
        <ChartSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Total Saved Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 border border-gray-100 dark:border-gray-700 transition-all duration-200 hover:shadow-md transform hover:-translate-y-1 group">
        <h2 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">Total Saved</h2>
        <div className="flex items-baseline space-x-3">
          <span className="text-4xl font-bold text-gray-900 dark:text-white group-hover:text-stacks-blue transition-colors duration-200">
            {formatSTX(totalSavedSTX, 4)} sBTC
          </span>
          <span className="text-xl text-gray-500 dark:text-gray-400 group-hover:text-stacks-blue/70 transition-colors duration-200">
            (${totalSavedUSD.toFixed(2)} USD)
          </span>
        </div>
      </div>

      {/* Active Savings Plan Card */}
      {savingsPlan ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 transition-all duration-200 hover:shadow-md transform hover:-translate-y-1">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Active Savings Plan</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSavingsPlanCreator(true)}
                className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transform hover:-translate-y-0.5 hover:shadow-md"
                aria-label="Create new savings plan"
              >
                Create New Plan
              </button>
              <button
                onClick={toggleSavingsPlan}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transform hover:-translate-y-0.5 hover:shadow-md ${
                  savingsPlan.isActive
                    ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 focus:ring-red-500'
                    : 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50 focus:ring-green-500'
                }`}
                aria-label={`${savingsPlan.isActive ? 'Pause' : 'Resume'} savings plan`}
              >
                {savingsPlan.isActive ? 'Pause' : 'Resume'}
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Amount per purchase</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {formatSTX(savingsPlan.amountPerPurchase, 4)} sBTC
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Frequency</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">{savingsPlan.frequency}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Next purchase</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {savingsPlan.nextPurchaseDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <NoSavingsPlanEmptyState onCreatePlan={() => setShowSavingsPlanCreator(true)} />
      )}

      {/* Savings Growth Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 transition-all duration-200 hover:shadow-md transform hover:-translate-y-1">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Savings Growth</h3>
        
        <div className="h-64 relative">
          {/* Simple line chart */}
          <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
            {/* Grid lines */}
            {[0, 1, 2, 3, 4].map((i) => (
              <line
                key={i}
                x1="0"
                y1={i * 50}
                x2="400"
                y2={i * 50}
                stroke="#f3f4f6"
                strokeWidth="1"
              />
            ))}
            
            {/* Chart line */}
            <polyline
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              points={chartData.map((point, index) => {
                const x = (index / (chartData.length - 1)) * 380 + 10;
                const maxValue = Math.max(...chartData.map(d => d.value));
                const y = 190 - ((point.value / maxValue) * 180);
                return `${x},${y}`;
              }).join(' ')}
            />
            
            {/* Area under line */}
            <polygon
              fill="#3b82f6"
              fillOpacity="0.1"
              points={`${chartData.map((point, index) => {
                const x = (index / (chartData.length - 1)) * 380 + 10;
                const maxValue = Math.max(...chartData.map(d => d.value));
                const y = 190 - ((point.value / maxValue) * 180);
                return `${x},${y}`;
              }).join(' ')} 390,190 10,190`}
            />
            
            {/* Data points */}
            {chartData.map((point, index) => {
              const x = (index / (chartData.length - 1)) * 380 + 10;
              const maxValue = Math.max(...chartData.map(d => d.value));
              const y = 190 - ((point.value / maxValue) * 180);
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="3"
                  fill="#3b82f6"
                />
              );
            })}
          </svg>
        </div>
        
        {/* X-axis labels */}
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          {chartData.map((point, index) => (
            <span key={index}>{point.date}</span>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 transition-all duration-200 hover:shadow-md transform hover:-translate-y-1 group">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Deposits</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatSTX(totalDeposits, 4)} sBTC
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            ${(totalDeposits * sBTCtoUSD).toFixed(2)} USD
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 transition-all duration-200 hover:shadow-md transform hover:-translate-y-1 group">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Withdrawn</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatSTX(totalWithdrawn, 4)} sBTC
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            ${(totalWithdrawn * sBTCtoUSD).toFixed(2)} USD
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 transition-all duration-200 hover:shadow-md transform hover:-translate-y-1 group">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Average Purchase Price</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            ${averagePurchasePrice.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">per sBTC</p>
        </div>
      </div>

      {/* Savings Plan Creator Modal */}
      {showSavingsPlanCreator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true" aria-labelledby="savings-plan-title">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transition-colors duration-200">
            <SavingsPlanCreator
              user={user}
              onClose={() => setShowSavingsPlanCreator(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}