import { useState, useEffect } from 'react';
import { SavingsTransaction, SortConfig } from '@/types';
import { microSTXToSTX, formatSTX, formatAddress } from '@/utils/stacks';

interface ResponsiveTransactionTableProps {
  transactions: SavingsTransaction[];
  onSort?: (sortConfig: SortConfig) => void;
  sortConfig?: SortConfig;
  itemsPerPage?: number;
}

export function ResponsiveTransactionTable({
  transactions,
  onSort,
  sortConfig,
  itemsPerPage = 10
}: ResponsiveTransactionTableProps) {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Calculate pagination
  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = transactions.slice(startIndex, endIndex);
  
  // Reset to first page when transactions change
  useEffect(() => {
    setCurrentPage(1);
  }, [transactions]);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return '📥';
      case 'withdrawal':
        return '📤';
      case 'interest':
        return '💰';
      case 'dca-purchase':
        return '🔄';
      default:
        return '📄';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'text-green-600';
      case 'withdrawal':
        return 'text-red-600';
      case 'interest':
        return 'text-purple-600';
      case 'dca-purchase':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Success
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Failed
          </span>
        );
      default:
        return null;
    }
  };

  const handleSort = (key: keyof SavingsTransaction) => {
    if (!onSort) return;
    
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig?.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    onSort({ key, direction });
  };

  const getSortIcon = (key: keyof SavingsTransaction) => {
    if (!sortConfig || sortConfig.key !== key) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return sortConfig.direction === 'asc' ? (
      <svg className="w-4 h-4 text-stacks-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-stacks-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
      </svg>
    );
  };

  // Mobile Card View
  const MobileCardView = () => (
    <div className="space-y-4 md:hidden">
      {paginatedTransactions.map((tx) => (
        <div key={tx.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          {/* Card Header with Transaction Type and Status */}
          <div className={`px-4 py-3 border-b ${getTransactionColor(tx.type)} bg-opacity-10`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-2xl mr-3">{getTransactionIcon(tx.type)}</span>
                <div>
                  <div className="text-sm font-medium text-gray-900 capitalize">
                    {tx.type.replace('-', ' ')}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(tx.timestamp).toLocaleDateString('en', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              </div>
              {getStatusBadge(tx.status)}
            </div>
          </div>
          
          {/* Card Body with Key Information */}
          <div className="p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-gray-600">Amount</span>
              <span className={`text-lg font-bold ${getTransactionColor(tx.type)}`}>
                {tx.type === 'withdrawal' ? '-' : '+'}
                {formatSTX(microSTXToSTX(tx.amount))} STX
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <span className="text-xs text-gray-500 block">Time</span>
                <span className="text-sm text-gray-900">
                  {new Date(tx.timestamp).toLocaleTimeString('en', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              
              {tx.btcPrice && (
                <div>
                  <span className="text-xs text-gray-500 block">BTC Price</span>
                  <span className="text-sm text-gray-900">
                    ${tx.btcPrice.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
            
            {/* Quick Actions */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setExpandedCard(expandedCard === tx.id ? null : tx.id)}
                className="flex-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-md transition-colors flex items-center justify-center"
              >
                <svg
                  className={`w-4 h-4 mr-1 transition-transform ${expandedCard === tx.id ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                {expandedCard === tx.id ? 'Hide' : 'Show'} Details
              </button>
              
              <a
                href={`https://explorer.stacks.co/txid/${tx.txHash}?chain=mainnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-sm bg-stacks-blue hover:bg-blue-600 text-white py-2 px-3 rounded-md transition-colors flex items-center justify-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Explorer
              </a>
            </div>
            
            {/* Expandable Details Section */}
            {expandedCard === tx.id && (
              <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Transaction Hash</span>
                    <a
                      href={`https://explorer.stacks.co/txid/${tx.txHash}?chain=mainnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-stacks-blue hover:text-blue-600 hover:underline font-mono"
                    >
                      {formatAddress(tx.txHash, 10)}
                    </a>
                  </div>
                  
                  {tx.blockHeight && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Block Height</span>
                      <span className="text-xs text-gray-900 font-mono">{tx.blockHeight}</span>
                    </div>
                  )}
                  
                  {tx.confirmations !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Confirmations</span>
                      <span className="text-xs text-gray-900">
                        {tx.confirmations} {tx.confirmations === 1 ? 'confirmation' : 'confirmations'}
                      </span>
                    </div>
                  )}
                  
                  {tx.fee && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Transaction Fee</span>
                      <span className="text-xs text-gray-900">{formatSTX(microSTXToSTX(tx.fee))} STX</span>
                    </div>
                  )}
                  
                  {tx.stxBalance && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Balance After</span>
                      <span className="text-xs text-gray-900">{formatSTX(microSTXToSTX(tx.stxBalance))} STX</span>
                    </div>
                  )}
                </div>
                
                {/* Additional Context for DCA Purchases */}
                {tx.type === 'dca-purchase' && tx.btcPrice && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-blue-700">
                      <span className="font-medium">DCA Purchase:</span> You bought STX when Bitcoin was priced at
                      <span className="font-bold"> ${tx.btcPrice.toLocaleString()}</span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  // Desktop Table View
  const DesktopTableView = () => (
    <div className="hidden md:block overflow-x-auto transition-colors duration-200">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 transition-colors duration-200">
        <thead className="bg-gray-50 dark:bg-gray-700 transition-colors duration-200">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('type')}
            >
              <div className="flex items-center gap-1">
                Transaction
                {getSortIcon('type')}
              </div>
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('amount')}
            >
              <div className="flex items-center gap-1">
                Amount
                {getSortIcon('amount')}
              </div>
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('timestamp')}
            >
              <div className="flex items-center gap-1">
                Date
                {getSortIcon('timestamp')}
              </div>
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Transaction Hash
            </th>
            {paginatedTransactions.some(tx => tx.btcPrice) && (
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                BTC Price
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 transition-colors duration-200">
          {paginatedTransactions.map((tx) => (
            <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{getTransactionIcon(tx.type)}</span>
                  <div>
                    <div className="text-sm font-medium text-gray-900 capitalize">
                      {tx.type.replace('-', ' ')}
                    </div>
                    {tx.blockHeight && (
                      <div className="text-xs text-gray-500">
                        Block: {tx.blockHeight}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className={`text-sm font-medium ${getTransactionColor(tx.type)}`}>
                  {tx.type === 'withdrawal' ? '-' : '+'}
                  {formatSTX(microSTXToSTX(tx.amount))} STX
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div>
                  {new Date(tx.timestamp).toLocaleDateString()}
                </div>
                <div className="text-xs">
                  {new Date(tx.timestamp).toLocaleTimeString()}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getStatusBadge(tx.status)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <a
                  href={`https://explorer.stacks.co/txid/${tx.txHash}?chain=mainnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-stacks-blue hover:text-blue-600 hover:underline"
                >
                  {formatAddress(tx.txHash, 8)}
                </a>
              </td>
              {tx.btcPrice && (
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${tx.btcPrice.toLocaleString()}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Pagination Controls
  const PaginationControls = () => {
    if (totalPages <= 1) return null;
    
    const getVisiblePages = () => {
      const delta = 2;
      const range: number[] = [];
      const rangeWithDots: (number | string)[] = [];
      let l: number | undefined;

      for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
          range.push(i);
        }
      }

      range.forEach((i) => {
        if (l) {
          if (i - l === 2) {
            rangeWithDots.push(l + 1);
          } else if (i - l !== 1) {
            rangeWithDots.push('...');
          }
        }
        rangeWithDots.push(i);
        l = i;
      });

      return rangeWithDots;
    };

    return (
      <div className="px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
        {/* Mobile Pagination */}
        <div className="md:hidden">
          <div className="flex flex-col space-y-3">
            <div className="text-sm text-gray-700 text-center">
              Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
              <span className="font-medium">{Math.min(endIndex, transactions.length)}</span> of{' '}
              <span className="font-medium">{transactions.length}</span> results
            </div>
            
            <div className="flex justify-center items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed min-w-[80px] justify-center"
              >
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>
              
              <div className="flex items-center gap-1">
                {getVisiblePages().map((page, index) => (
                  <span key={index}>
                    {page === '...' ? (
                      <span className="px-2 py-1 text-gray-500">...</span>
                    ) : (
                      <button
                        onClick={() => setCurrentPage(page as number)}
                        className={`relative inline-flex items-center px-3 py-2 text-sm font-medium rounded-md min-w-[36px] ${
                          currentPage === page
                            ? 'z-10 bg-stacks-blue text-white border-stacks-blue'
                            : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    )}
                  </span>
                ))}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed min-w-[80px] justify-center"
              >
                Next
                <svg className="h-4 w-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Desktop Pagination */}
        <div className="hidden md:flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
            <span className="font-medium">{Math.min(endIndex, transactions.length)}</span> of{' '}
            <span className="font-medium">{transactions.length}</span> results
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Previous</span>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="flex items-center gap-1">
              {getVisiblePages().map((page, index) => (
                <span key={index}>
                  {page === '...' ? (
                    <span className="px-3 py-2 text-gray-500">...</span>
                  ) : (
                    <button
                      onClick={() => setCurrentPage(page as number)}
                      className={`relative inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                        currentPage === page
                          ? 'z-10 bg-stacks-blue text-white border-stacks-blue'
                          : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  )}
                </span>
              ))}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Next</span>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-5xl mb-4">📭</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
        <p className="text-gray-600">
          No transactions match your current filters.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow transition-colors duration-200">
      <MobileCardView />
      <DesktopTableView />
      <PaginationControls />
    </div>
  );
}