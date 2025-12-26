import { microSTXToSTX, formatSTX } from '@/utils/stacks';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'interest';
  amount: number;
  timestamp: number;
  status: 'pending' | 'success' | 'failed';
  txId: string;
  blockHeight?: number;
}

interface TransactionSummaryProps {
  transactions: Transaction[];
}

export function TransactionSummary({ transactions }: TransactionSummaryProps) {
  const totalDeposits = transactions
    .filter(tx => tx.type === 'deposit')
    .reduce((sum, tx) => sum + tx.amount, 0);
    
  const totalWithdrawals = transactions
    .filter(tx => tx.type === 'withdrawal')
    .reduce((sum, tx) => sum + tx.amount, 0);
    
  const totalInterest = transactions
    .filter(tx => tx.type === 'interest')
    .reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="card">
        <h3 className="text-lg font-semibold mb-2 text-gray-600">Total Deposits</h3>
        <p className="text-2xl font-bold text-green-600">
          {formatSTX(microSTXToSTX(totalDeposits))} STX
        </p>
      </div>
      
      <div className="card">
        <h3 className="text-lg font-semibold mb-2 text-gray-600">Total Withdrawals</h3>
        <p className="text-2xl font-bold text-red-600">
          {formatSTX(microSTXToSTX(totalWithdrawals))} STX
        </p>
      </div>
      
      <div className="card">
        <h3 className="text-lg font-semibold mb-2 text-gray-600">Interest Earned</h3>
        <p className="text-2xl font-bold text-purple-600">
          {formatSTX(microSTXToSTX(totalInterest))} STX
        </p>
      </div>
    </div>
  );
}