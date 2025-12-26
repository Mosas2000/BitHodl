import { useAppKitWallet } from '@/hooks/useAppKitWallet';
import { useSavingsContract } from '@/hooks/useSavingsContract';
import { microSTXToSTX } from '@/utils/stacks';
import { DepositForm } from './DepositForm';
import { WithdrawForm } from './WithdrawForm';
import { TransactionStatusAlert } from './TransactionStatus';

interface TransactionFormProps {
  userAddress: string | null;
}

export function TransactionForm({ userAddress }: TransactionFormProps) {
  const { isConnected } = useAppKitWallet();
  const {
    deposit,
    withdraw,
    transactionStatus,
    contractState,
    transactionFlow,
    retryTransaction,
    clearCurrentTransaction
  } = useSavingsContract(userAddress);
  const userBalanceSTX = microSTXToSTX(contractState.userBalance);

  return (
    <div className="space-y-6">
      {/* Current Transaction Status */}
      {transactionFlow.currentTransaction && (
        <TransactionStatusAlert
          transaction={transactionFlow.currentTransaction}
          onRetry={retryTransaction}
          onDismiss={clearCurrentTransaction}
          showExplorerLink={true}
        />
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DepositForm
          onDeposit={deposit}
          isLoading={transactionStatus.loading}
          disabled={!isConnected}
          currentTransaction={transactionFlow.currentTransaction}
        />
        
        <WithdrawForm
          onWithdraw={withdraw}
          isLoading={transactionStatus.loading}
          disabled={!isConnected}
          availableBalance={userBalanceSTX}
          currentTransaction={transactionFlow.currentTransaction}
        />
      </div>
    </div>
  );
}