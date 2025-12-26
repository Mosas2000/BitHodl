import { microSTXToSTX, formatSTX, formatAddress } from '@/utils/stacks';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'interest';
  amount: number;
  timestamp: number;
  status: 'pending' | 'success' | 'failed';
  txId: string;
  blockHeight?: number;
}

interface TransactionTableProps {
  transactions: Transaction[];
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return '📥';
      case 'withdrawal':
        return '📤';
      case 'interest':
        return '💰';
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

  if (transactions.length === 0) {
    return (
      <div className="card text-center py-12">
        <div className="text-gray-400 text-5xl mb-4">📭</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
        <p className="text-gray-600">
          No transactions match your current filters.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Transaction
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Transaction ID
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((tx: Transaction) => (
              <tr key={tx.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{getTransactionIcon(tx.type)}</span>
                    <div>
                      <div className="text-sm font-medium text-gray-900 capitalize">
                        {tx.type}
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
                    href={`https://explorer.stacks.co/txid/${tx.txId}?chain=mainnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-stacks-blue hover:text-blue-600 hover:underline"
                  >
                    {formatAddress(tx.txId, 8)}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}