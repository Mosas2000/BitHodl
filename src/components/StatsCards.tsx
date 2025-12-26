import { microSTXToSTX, formatSTX } from '@/utils/stacks';
import { ContractState } from '@/types';

interface StatsCardsProps {
  contractState: ContractState;
  isBalanceLoading?: boolean;
}

export function StatsCards({ contractState, isBalanceLoading = false }: StatsCardsProps) {
  const totalDepositsSTX = microSTXToSTX(contractState.totalDeposits);
  const userBalanceSTX = microSTXToSTX(contractState.userBalance);
  const interestEarnedSTX = contractState.userDeposit
    ? microSTXToSTX(contractState.userDeposit.interestEarned)
    : 0;

  // Mock USD conversion (in real app, you'd fetch from price oracle)
  const stxToUSD = 1.5; // $1.50 per STX

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="card">
        <h2 className="text-lg font-semibold mb-2 text-gray-600">Total Savings</h2>
        <p className="text-2xl font-bold text-stacks-orange">
          {formatSTX(totalDepositsSTX)} STX
        </p>
        <p className="text-gray-600 mt-1">
          ${(totalDepositsSTX * stxToUSD).toFixed(2)} USD
        </p>
      </div>
      
      <div className="card">
        <h2 className="text-lg font-semibold mb-2 text-gray-600">Your Balance</h2>
        <p className="text-2xl font-bold text-stacks-blue">
          {isBalanceLoading ? (
            <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
          ) : (
            formatSTX(userBalanceSTX)
          )} STX
        </p>
        <p className="text-gray-600 mt-1">
          ${(userBalanceSTX * stxToUSD).toFixed(2)} USD
        </p>
      </div>
      
      <div className="card">
        <h2 className="text-lg font-semibold mb-2 text-gray-600">Interest Earned</h2>
        <p className="text-2xl font-bold text-green-600">
          {formatSTX(interestEarnedSTX)} STX
        </p>
        <p className="text-gray-600 mt-1">
          ${(interestEarnedSTX * stxToUSD).toFixed(2)} USD
        </p>
      </div>
      
      <div className="card">
        <h2 className="text-lg font-semibold mb-2 text-gray-600">APY Rate</h2>
        <p className="text-2xl font-bold text-purple-600">
          {contractState.interestRate}%
        </p>
        <p className="text-gray-600 mt-1">Annual Percentage Yield</p>
      </div>
    </div>
  );
}