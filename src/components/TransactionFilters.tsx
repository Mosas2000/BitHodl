interface TransactionFiltersProps {
  filter: 'all' | 'deposit' | 'withdrawal' | 'interest';
  searchTerm: string;
  onFilterChange: (filter: 'all' | 'deposit' | 'withdrawal' | 'interest') => void;
  onSearchChange: (searchTerm: string) => void;
}

export function TransactionFilters({ 
  filter, 
  searchTerm, 
  onFilterChange, 
  onSearchChange 
}: TransactionFiltersProps) {
  return (
    <div className="card">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by transaction ID or type..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-stacks-blue focus:border-transparent"
          />
        </div>
        
        {/* Filter */}
        <div>
          <select
            value={filter}
            onChange={(e) => onFilterChange(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-stacks-blue focus:border-transparent"
          >
            <option value="all">All Transactions</option>
            <option value="deposit">Deposits</option>
            <option value="withdrawal">Withdrawals</option>
            <option value="interest">Interest</option>
          </select>
        </div>
      </div>
    </div>
  );
}