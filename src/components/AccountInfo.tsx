import { microSTXToSTX, formatSTX } from '@/utils/stacks';
import { ContractState } from '@/types';

interface AccountInfoProps {
  contractState: ContractState;
}

export function AccountInfo({ contractState }: AccountInfoProps) {
  const userDepositSTX = contractState.userDeposit 
    ? microSTXToSTX(contractState.userDeposit.amount)
    : 0;
  const interestEarnedSTX = contractState.userDeposit
    ? microSTXToSTX(contractState.userDeposit.interestEarned)
    : 0;

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">Account Info</h2>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">Principal:</span>
          <span className="font-medium">{formatSTX(userDepositSTX)} STX</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Interest:</span>
          <span className="font-medium">{formatSTX(interestEarnedSTX)} STX</span>
        </div>
        {contractState.userDeposit && (
          <div className="flex justify-between">
            <span className="text-gray-600">Deposit Date:</span>
            <span className="font-medium">
              {new Date(contractState.userDeposit.timestamp).toLocaleDateString()}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-600">Days Active:</span>
          <span className="font-medium">
            {contractState.userDeposit 
              ? Math.floor((Date.now() - contractState.userDeposit.timestamp) / (1000 * 60 * 60 * 24))
              : 0
            }
          </span>
        </div>
      </div>
    </div>
  );
}