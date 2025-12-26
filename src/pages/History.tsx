import { useState, useMemo, useEffect } from 'react';
import { useAppKitWallet } from '@/hooks/useAppKitWallet';
import { useSavingsContract } from '@/hooks/useSavingsContract';
import { SavingsTransaction, TransactionFilters, SortConfig } from '@/types';
import { microSTXToSTX } from '@/utils/stacks';
import { exportTransactionsToCSV, exportDCAPerformanceToCSV, exportSummaryToCSV, ExportOptions, DCAExportOptions } from '@/utils/csvExport';
import { EnhancedTransactionFilters } from '@/components/EnhancedTransactionFilters';
import { ResponsiveTransactionTable } from '@/components/ResponsiveTransactionTable';
import { DCAPerformanceChart } from '@/components/DCAPerformanceChart';
import { TransactionTableSkeleton, CardSkeleton } from '@/components/LoadingSkeleton';
import { NoTransactionsEmptyState, NoSearchResultsEmptyState } from '@/components/EmptyState';

export function History() {
  const { user } = useAppKitWallet();
  const { transactionHistory } = useSavingsContract(user?.address || null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);
  
  // Initialize filters with default date range (last 3 months)
  const [filters, setFilters] = useState<TransactionFilters>(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - 3);
    
    return {
      dateRange: { startDate, endDate },
      type: 'all',
      status: 'all',
      searchTerm: ''
    };
  });
  
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [currentBTCPrice] = useState(42500); // Mock current BTC price
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeHeaders: true,
    dateFormat: 'short',
    includeMetadata: true,
    includeFees: true,
    includeBalances: true,
    includeBTCPrices: true
  });
  const [dcaExportOptions, setDcaExportOptions] = useState<DCAExportOptions>({
    includeComparison: true,
    includeProjections: false,
    projectionMonths: 12
  });
  const [isPrintMode, setIsPrintMode] = useState(false);

  // Filter and sort transactions
  const processedTransactions = useMemo(() => {
    let filtered = transactionHistory.filter((tx: SavingsTransaction) => {
      // Date range filter
      const txDate = new Date(tx.timestamp);
      const matchesDateRange = txDate >= filters.dateRange.startDate && txDate <= filters.dateRange.endDate;
      
      // Type filter
      const matchesType = filters.type === 'all' || tx.type === filters.type;
      
      // Status filter
      const matchesStatus = filters.status === 'all' || tx.status === filters.status;
      
      // Search filter
      const matchesSearch = filters.searchTerm === '' ||
        tx.txHash.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        tx.type.toLowerCase().includes(filters.searchTerm.toLowerCase());
      
      return matchesDateRange && matchesType && matchesStatus && matchesSearch;
    });

    // Sort transactions
    if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue === undefined || bValue === undefined) return 0;
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    } else {
      // Default sort: newest first
      filtered.sort((a, b) => b.timestamp - a.timestamp);
    }

    return filtered;
  }, [transactionHistory, filters, sortConfig]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalDeposits = processedTransactions
      .filter(tx => tx.type === 'deposit')
      .reduce((sum, tx) => sum + tx.amount, 0);
      
    const totalWithdrawals = processedTransactions
      .filter(tx => tx.type === 'withdrawal')
      .reduce((sum, tx) => sum + tx.amount, 0);
      
    const totalInterest = processedTransactions
      .filter(tx => tx.type === 'interest')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalDCA = processedTransactions
      .filter(tx => tx.type === 'dca-purchase')
      .reduce((sum, tx) => sum + tx.amount, 0);

    return {
      totalDeposits: microSTXToSTX(totalDeposits),
      totalWithdrawals: microSTXToSTX(totalWithdrawals),
      totalInterest: microSTXToSTX(totalInterest),
      totalDCA: microSTXToSTX(totalDCA),
      netDeposits: microSTXToSTX(totalDeposits - totalWithdrawals)
    };
  }, [processedTransactions]);

  // Calculate average purchase price for DCA transactions
  const averagePurchasePrice = useMemo(() => {
    const dcaPurchases = processedTransactions.filter(tx => tx.type === 'dca-purchase' && tx.status === 'success' && tx.btcPrice);
    
    if (dcaPurchases.length === 0) {
      return null;
    }

    let weightedSum = 0;
    let totalAmount = 0;
    
    dcaPurchases.forEach(tx => {
      const amount = microSTXToSTX(tx.amount);
      weightedSum += amount * (tx.btcPrice || 0);
      totalAmount += amount;
    });
    
    return {
      averagePrice: weightedSum / totalAmount,
      totalAmount,
      purchaseCount: dcaPurchases.length,
      lowestPrice: Math.min(...dcaPurchases.map(tx => tx.btcPrice || 0)),
      highestPrice: Math.max(...dcaPurchases.map(tx => tx.btcPrice || 0))
    };
  }, [processedTransactions]);

  const handleExportTransactions = () => {
    exportTransactionsToCSV(processedTransactions, undefined, exportOptions);
  };

  const handleExportDCA = () => {
    // Calculate DCA performance for export
    const dcaPurchases = processedTransactions.filter(tx => tx.type === 'dca-purchase' && tx.status === 'success');
    if (dcaPurchases.length > 0) {
      const totalInvestedSTX = dcaPurchases.reduce((sum, tx) => sum + tx.amount, 0);
      const totalInvested = microSTXToSTX(totalInvestedSTX);
      
      let weightedSum = 0;
      dcaPurchases.forEach(tx => {
        if (tx.btcPrice) {
          weightedSum += microSTXToSTX(tx.amount) * tx.btcPrice;
        }
      });
      const averagePurchasePrice = weightedSum / totalInvested;
      const currentValue = totalInvested * (currentBTCPrice / averagePurchasePrice);
      const totalGain = currentValue - totalInvested;
      const percentageGain = (totalGain / totalInvested) * 100;
      
      const firstPurchasePrice = dcaPurchases[0]?.btcPrice || averagePurchasePrice;
      const lumpSumValue = totalInvested * (currentBTCPrice / firstPurchasePrice);

      exportDCAPerformanceToCSV({
        totalInvested,
        currentValue,
        totalGain,
        percentageGain,
        averagePurchasePrice,
        currentPrice: currentBTCPrice,
        dcaValue: currentValue,
        lumpSumValue
      }, undefined, dcaExportOptions);
    }
  };

  const handleExportSummary = () => {
    exportSummaryToCSV(summaryStats);
  };

  const handlePrint = () => {
    setIsPrintMode(true);
    setTimeout(() => {
      window.print();
      setIsPrintMode(false);
    }, 100);
  };

  // Print styles component
  const PrintStyles = () => (
    <style dangerouslySetInnerHTML={{
      __html: `
        @media print {
          body * {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        
        .no-print {
          display: none !important;
        }
        
        .print-only {
          display: block !important;
        }
        
        .print-break {
          page-break-after: always;
        }
        
        .print-header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 10px;
        }
        
        .print-summary {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .print-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        
        .print-table th,
        .print-table td {
          border: 1px solid #e5e7eb;
          padding: 8px;
          text-align: left;
        }
        
        .print-table th {
          background-color: #f3f4f6;
          font-weight: bold;
        }
        
        .print-footer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          text-align: center;
          font-size: 10px;
          color: #6b7280;
          border-top: 1px solid #e5e7eb;
          padding-top: 5px;
        }
      }
    `
  }} />
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="h-9 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-6 w-80 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
          <div className="flex gap-2 mt-4 sm:mt-0">
            <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm">
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
                <div className="h-8 w-32 bg-gray-200 dark:bg-gray-600 rounded mb-1"></div>
                <div className="h-4 w-20 bg-gray-200 dark:bg-gray-600 rounded"></div>
              </div>
            ))}
          </div>
        </div>
        
        <TransactionTableSkeleton rows={5} />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isPrintMode ? 'print-only' : ''}`}>
      <PrintStyles />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Transaction History</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">View and track all your savings transactions</p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <div className="relative">
            <button
              onClick={() => setShowExportOptions(!showExportOptions)}
              className="btn-secondary"
              disabled={processedTransactions.length === 0}
              aria-expanded={showExportOptions}
              aria-haspopup="menu"
            >
              Export Options
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showExportOptions && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-4">
                <h4 className="font-medium text-gray-900 mb-3">Export Options</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={exportOptions.includeHeaders}
                        onChange={(e) => setExportOptions({...exportOptions, includeHeaders: e.target.checked})}
                        className="mr-2"
                      />
                      <span className="text-sm">Include Headers</span>
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Format</label>
                    <select
                      value={exportOptions.dateFormat}
                      onChange={(e) => setExportOptions({...exportOptions, dateFormat: e.target.value as 'short' | 'long' | 'iso'})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="short">Short (MM/DD/YYYY)</option>
                      <option value="long">Long (Month DD, YYYY)</option>
                      <option value="iso">ISO (YYYY-MM-DD)</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={exportOptions.includeMetadata}
                        onChange={(e) => setExportOptions({...exportOptions, includeMetadata: e.target.checked})}
                        className="mr-2"
                      />
                      <span className="text-sm">Include Metadata (Hash, Block, Confirmations)</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={exportOptions.includeFees}
                        onChange={(e) => setExportOptions({...exportOptions, includeFees: e.target.checked})}
                        className="mr-2"
                      />
                      <span className="text-sm">Include Fees</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={exportOptions.includeBTCPrices}
                        onChange={(e) => setExportOptions({...exportOptions, includeBTCPrices: e.target.checked})}
                        className="mr-2"
                      />
                      <span className="text-sm">Include BTC Prices</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={exportOptions.includeBalances}
                        onChange={(e) => setExportOptions({...exportOptions, includeBalances: e.target.checked})}
                        className="mr-2"
                      />
                      <span className="text-sm">Include Balance After</span>
                    </label>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={dcaExportOptions.includeComparison}
                        onChange={(e) => setDcaExportOptions({...dcaExportOptions, includeComparison: e.target.checked})}
                        className="mr-2"
                      />
                      <span className="text-sm">Include DCA vs Lump Sum Comparison</span>
                    </label>
                    
                    <label className="flex items-center mt-2">
                      <input
                        type="checkbox"
                        checked={dcaExportOptions.includeProjections}
                        onChange={(e) => setDcaExportOptions({...dcaExportOptions, includeProjections: e.target.checked})}
                        className="mr-2"
                      />
                      <span className="text-sm">Include Projections</span>
                    </label>
                    
                    {dcaExportOptions.includeProjections && (
                      <div className="mt-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Projection Months</label>
                        <input
                          type="number"
                          min="1"
                          max="60"
                          value={dcaExportOptions.projectionMonths}
                          onChange={(e) => setDcaExportOptions({...dcaExportOptions, projectionMonths: parseInt(e.target.value) || 12})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4 pt-3 border-t">
                  <button
                    onClick={handleExportSummary}
                    className="flex-1 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                  >
                    Export Summary
                  </button>
                  <button
                    onClick={() => setShowExportOptions(false)}
                    className="flex-1 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={handleExportDCA}
            className="btn-secondary"
            disabled={!processedTransactions.some(tx => tx.type === 'dca-purchase')}
            aria-label="Export DCA report"
          >
            Export DCA Report
          </button>
          <button
            onClick={handleExportTransactions}
            className="btn-primary"
            disabled={processedTransactions.length === 0}
            aria-label="Export transactions"
          >
            Export Transactions
          </button>
          <button
            onClick={handlePrint}
            className="btn-secondary"
            disabled={processedTransactions.length === 0}
            aria-label="Print transaction history"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v2a2 2 0 002-2h-2m0 0v-2a2 2 0 00-2 2H5m0 0v-2a2 2 0 00-2 2h14a2 2 0 002 2v2a2 2 0 002-2zm-2 0H9a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H9m0 0v-2a2 2 0 00-2 2h14a2 2 0 002 2v2a2 2 0 002-2z" />
            </svg>
            Print
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-100 dark:border-gray-700 transition-colors duration-200">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Deposits</p>
          <p className="text-lg font-bold text-green-600 dark:text-green-400">
            {summaryStats.totalDeposits.toFixed(6)} STX
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-100 dark:border-gray-700 transition-colors duration-200">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Withdrawals</p>
          <p className="text-lg font-bold text-red-600 dark:text-red-400">
            {summaryStats.totalWithdrawals.toFixed(6)} STX
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-100 dark:border-gray-700 transition-colors duration-200">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Interest Earned</p>
          <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
            {summaryStats.totalInterest.toFixed(6)} STX
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-100 dark:border-gray-700 transition-colors duration-200">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">DCA Purchases</p>
          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {summaryStats.totalDCA.toFixed(6)} STX
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-100 dark:border-gray-700 transition-colors duration-200">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Net Deposits</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {summaryStats.netDeposits.toFixed(6)} STX
          </p>
        </div>
      </div>

      {/* Key Metrics Summary */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg shadow p-6 border border-purple-100 dark:border-purple-800/30 transition-colors duration-200">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Portfolio Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Total Transactions</span>
              <span className="text-2xl">📊</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {processedTransactions.length}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {processedTransactions.filter(tx => tx.status === 'success').length} successful
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Success Rate</span>
              <span className="text-2xl">✅</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {processedTransactions.length > 0
                ? ((processedTransactions.filter(tx => tx.status === 'success').length / processedTransactions.length) * 100).toFixed(1)
                : '0'}%
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {processedTransactions.filter(tx => tx.status === 'pending').length} pending
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Total Volume</span>
              <span className="text-2xl">💰</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {summaryStats.totalDeposits.toFixed(6)} STX
            </p>
            <p className="text-xs text-gray-500 mt-1">
              All transaction types
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Avg Transaction</span>
              <span className="text-2xl">📈</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {processedTransactions.length > 0
                ? (summaryStats.totalDeposits / processedTransactions.length).toFixed(6)
                : '0'} STX
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Per transaction
            </p>
          </div>
        </div>
        
        {/* Transaction Type Breakdown */}
        <div className="mt-6">
          <h4 className="text-md font-semibold mb-3 text-gray-900">Transaction Breakdown</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Deposits</p>
              <p className="text-lg font-bold text-green-600">
                {processedTransactions.filter(tx => tx.type === 'deposit').length}
              </p>
            </div>
            
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Withdrawals</p>
              <p className="text-lg font-bold text-red-600">
                {processedTransactions.filter(tx => tx.type === 'withdrawal').length}
              </p>
            </div>
            
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Interest</p>
              <p className="text-lg font-bold text-purple-600">
                {processedTransactions.filter(tx => tx.type === 'interest').length}
              </p>
            </div>
            
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-sm text-gray-600 mb-1">DCA Purchases</p>
              <p className="text-lg font-bold text-blue-600">
                {processedTransactions.filter(tx => tx.type === 'dca-purchase').length}
              </p>
            </div>
          </div>
        </div>
        
        {/* Time-based Analytics */}
        <div className="mt-6">
          <h4 className="text-md font-semibold mb-3 text-gray-900">Activity Timeline</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">First Transaction</p>
              <p className="text-lg font-bold text-gray-900">
                {processedTransactions.length > 0
                  ? new Date(Math.min(...processedTransactions.map(tx => tx.timestamp))).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Last Transaction</p>
              <p className="text-lg font-bold text-gray-900">
                {processedTransactions.length > 0
                  ? new Date(Math.max(...processedTransactions.map(tx => tx.timestamp))).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Activity Span</p>
              <p className="text-lg font-bold text-gray-900">
                {processedTransactions.length > 1
                  ? Math.ceil((Math.max(...processedTransactions.map(tx => tx.timestamp)) -
                      Math.min(...processedTransactions.map(tx => tx.timestamp))) / (1000 * 60 * 60 * 24))
                  : 0} days
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Average Purchase Price Card */}
      {averagePurchasePrice && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Average Purchase Price Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Average Price</p>
              <p className="text-xl font-bold text-blue-900">
                ${averagePurchasePrice.averagePrice.toLocaleString()}
              </p>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Total Invested</p>
              <p className="text-xl font-bold text-gray-900">
                {averagePurchasePrice.totalAmount.toFixed(6)} STX
              </p>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Purchase Count</p>
              <p className="text-xl font-bold text-gray-900">
                {averagePurchasePrice.purchaseCount}
              </p>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Lowest Price</p>
              <p className="text-xl font-bold text-green-600">
                ${averagePurchasePrice.lowestPrice.toLocaleString()}
              </p>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Highest Price</p>
              <p className="text-xl font-bold text-red-600">
                ${averagePurchasePrice.highestPrice.toLocaleString()}
              </p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-white bg-opacity-60 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Dollar Cost Averaging Benefit:</span> You've purchased at an average price of
              <span className="font-bold text-blue-900"> ${averagePurchasePrice.averagePrice.toLocaleString()}</span>,
              which is {currentBTCPrice > averagePurchasePrice.averagePrice ? (
                <span className="text-green-600 font-medium">
                  ${(currentBTCPrice - averagePurchasePrice.averagePrice).toLocaleString()} below the current price
                </span>
              ) : (
                <span className="text-red-600 font-medium">
                  ${(averagePurchasePrice.averagePrice - currentBTCPrice).toLocaleString()} above the current price
                </span>
              )}.
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="no-print">
        <EnhancedTransactionFilters
          filters={filters}
          onFiltersChange={setFilters}
        />
      </div>

      {/* DCA Performance Chart */}
      <div className="no-print">
        {processedTransactions.some(tx => tx.type === 'dca-purchase') && (
          <DCAPerformanceChart
            transactions={processedTransactions}
            currentBTCPrice={currentBTCPrice}
          />
        )}
      </div>

      {/* Transaction List */}
      {transactionHistory.length === 0 ? (
        <NoTransactionsEmptyState onDeposit={() => {}} />
      ) : processedTransactions.length === 0 ? (
        <NoSearchResultsEmptyState onClearSearch={() => setFilters({
          dateRange: { startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), endDate: new Date() },
          type: 'all',
          status: 'all',
          searchTerm: ''
        })} />
      ) : (
        <div className="no-print">
          <ResponsiveTransactionTable
            transactions={processedTransactions}
            onSort={setSortConfig}
            sortConfig={sortConfig || undefined}
            itemsPerPage={15}
          />
        </div>
      )}
    </div>
  );
}
