import { useState } from 'react';
import { TransactionFilters, DateRange } from '@/types';
import { DateRangeFilter } from './DateRangeFilter';

interface EnhancedTransactionFiltersProps {
  filters: TransactionFilters;
  onFiltersChange: (filters: TransactionFilters) => void;
}

export function EnhancedTransactionFilters({ 
  filters, 
  onFiltersChange 
}: EnhancedTransactionFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDateRangeChange = (dateRange: DateRange) => {
    onFiltersChange({
      ...filters,
      dateRange
    });
  };

  const handleTypeChange = (type: TransactionFilters['type']) => {
    onFiltersChange({
      ...filters,
      type
    });
  };

  const handleStatusChange = (status: TransactionFilters['status']) => {
    onFiltersChange({
      ...filters,
      status
    });
  };

  const handleSearchChange = (searchTerm: string) => {
    onFiltersChange({
      ...filters,
      searchTerm
    });
  };

  const resetFilters = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - 3); // Default to last 3 months
    
    onFiltersChange({
      dateRange: { startDate, endDate },
      type: 'all',
      status: 'all',
      searchTerm: ''
    });
  };

  const hasActiveFilters = 
    filters.type !== 'all' || 
    filters.status !== 'all' || 
    filters.searchTerm !== '' ||
    (filters.dateRange.startDate.getTime() !== new Date().setMonth(new Date().getMonth() - 3));

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search - Always visible */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <input
            type="text"
            placeholder="Search by transaction hash or type..."
            value={filters.searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-stacks-blue focus:border-transparent"
          />
        </div>
        
        {/* Date Range - Always visible */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date Range
          </label>
          <DateRangeFilter 
            dateRange={filters.dateRange}
            onDateRangeChange={handleDateRangeChange}
          />
        </div>

        {/* Toggle for advanced filters */}
        <div className="flex items-end">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-stacks-blue focus:border-transparent"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span>Advanced Filters</span>
            <svg 
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Advanced Filters - Expandable */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Transaction Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleTypeChange(e.target.value as TransactionFilters['type'])}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-stacks-blue focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="deposit">Deposits</option>
                <option value="withdrawal">Withdrawals</option>
                <option value="interest">Interest</option>
                <option value="dca-purchase">DCA Purchases</option>
              </select>
            </div>
            
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleStatusChange(e.target.value as TransactionFilters['status'])}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-stacks-blue focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="success">Success</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          {/* Reset Button */}
          {hasActiveFilters && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-sm text-stacks-blue hover:text-blue-600 border border-stacks-blue hover:bg-blue-50 rounded-lg transition-colors"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap gap-2">
          {filters.type !== 'all' && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Type: {filters.type.replace('-', ' ')}
            </span>
          )}
          {filters.status !== 'all' && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Status: {filters.status}
            </span>
          )}
          {filters.searchTerm && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Search: "{filters.searchTerm}"
            </span>
          )}
        </div>
      )}
    </div>
  );
}