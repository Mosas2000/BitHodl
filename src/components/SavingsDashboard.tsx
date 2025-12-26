import { ContractState } from '@/types';
import { microSTXToSTX, formatSTX } from '@/utils/stacks';

interface SavingsDashboardProps {
  contractState: ContractState;
}

export function SavingsDashboard({ contractState }: SavingsDashboardProps) {
  const totalDepositsSTX = microSTXToSTX(contractState.totalDeposits);
  const userBalanceSTX = microSTXToSTX(contractState.userBalance);
  const userDepositSTX = contractState.userDeposit
    ? microSTXToSTX(contractState.userDeposit.amount)
    : 0;
  const interestEarnedSTX = contractState.userDeposit
    ? microSTXToSTX(contractState.userDeposit.interestEarned)
    : 0;

  // Mock USD conversion (in real app, you'd fetch from price oracle)
  const stxToUSD = 1.5; // $1.50 per STX

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Total Savings</h2>
          <p className="text-3xl font-bold text-stacks-orange">
            {formatSTX(totalDepositsSTX)} STX
          </p>
          <p className="text-gray-600 mt-2">
            ${(totalDepositsSTX * stxToUSD).toFixed(2)} USD
          </p>
        </div>
        
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Your Balance</h2>
          <p className="text-3xl font-bold text-stacks-blue">
            {formatSTX(userBalanceSTX)} STX
          </p>
          <p className="text-gray-600 mt-2">
            ${(userBalanceSTX * stxToUSD).toFixed(2)} USD
          </p>
        </div>
        
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Interest Earned</h2>
          <p className="text-3xl font-bold text-green-600">
            {formatSTX(interestEarnedSTX)} STX
          </p>
          <p className="text-gray-600 mt-2">
            ${(interestEarnedSTX * stxToUSD).toFixed(2)} USD
          </p>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Contract Info</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Interest Rate (APY):</span>
            <span className="font-medium">{contractState.interestRate}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Your Principal:</span>
            <span className="font-medium">{formatSTX(userDepositSTX)} STX</span>
          </div>
          {contractState.userDeposit && (
            <div className="flex justify-between">
              <span className="text-gray-600">Deposit Date:</span>
              <span className="font-medium">
                {new Date(contractState.userDeposit.timestamp).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
