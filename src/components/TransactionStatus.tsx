import { TransactionDetails, TransactionState } from '@/types';

interface TransactionStatusProps {
  transaction: TransactionDetails | null;
  onRetry?: (transactionId: string) => void;
  onDismiss?: (transactionId: string) => void;
  showExplorerLink?: boolean;
}

export function TransactionStatusAlert({
  transaction,
  onRetry,
  onDismiss,
  showExplorerLink = true
}: TransactionStatusProps) {
  if (!transaction) return null;

  const getStateIcon = (state: TransactionState) => {
    switch (state) {
      case 'pending':
        return (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
        );
      case 'broadcasting':
        return (
          <div className="animate-pulse">
            <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'confirmed':
        return (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'failed':
        return (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getStateText = (state: TransactionState) => {
    switch (state) {
      case 'pending':
        return 'Preparing transaction...';
      case 'broadcasting':
        return 'Transaction broadcasted';
      case 'confirmed':
        return 'Transaction confirmed';
      case 'failed':
        return 'Transaction failed';
      default:
        return 'Unknown status';
    }
  };

  const getStateColor = (state: TransactionState) => {
    switch (state) {
      case 'pending':
      case 'broadcasting':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'confirmed':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'failed':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getTransactionTypeText = (type: TransactionDetails['type']) => {
    switch (type) {
      case 'deposit':
        return 'Deposit';
      case 'withdraw':
        return 'Withdrawal';
      case 'create-plan':
        return 'Create Savings Plan';
      case 'update-plan':
        return 'Update Savings Plan';
      case 'toggle-auto':
        return 'Toggle Auto-Purchase';
      case 'execute-purchase':
        return 'Execute Purchase';
      default:
        return 'Transaction';
    }
  };

  const canRetry = transaction.state === 'failed' && onRetry && (transaction.retryCount || 0) < 3;

  return (
    <div className={`border rounded-lg p-4 ${getStateColor(transaction.state)}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-0.5">
            {getStateIcon(transaction.state)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">
                {getTransactionTypeText(transaction.type)}
              </p>
              {transaction.amount && (
                <span className="text-sm opacity-75">
                  ({transaction.amount.toFixed(6)} STX)
                </span>
              )}
            </div>
            <p className="text-sm mt-1">
              {getStateText(transaction.state)}
            </p>
            
            {transaction.txId && (
              <div className="mt-2 space-y-1">
                <p className="text-xs opacity-75">
                  Transaction ID: {transaction.txId.slice(0, 10)}...{transaction.txId.slice(-8)}
                </p>
                {showExplorerLink && transaction.explorerUrl && (
                  <a
                    href={transaction.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs underline hover:no-underline"
                  >
                    View in Explorer
                  </a>
                )}
              </div>
            )}

            {transaction.error && (
              <p className="text-sm mt-2 opacity-90">
                Error: {transaction.error}
              </p>
            )}

            {transaction.retryCount && transaction.retryCount > 0 && (
              <p className="text-xs mt-1 opacity-75">
                Retry attempt {transaction.retryCount}/3
              </p>
            )}

            {transaction.confirmations !== undefined && (
              <p className="text-xs mt-1 opacity-75">
                {transaction.confirmations} confirmation{transaction.confirmations !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 ml-4">
          {canRetry && (
            <button
              onClick={() => onRetry!(transaction.id)}
              className="text-sm font-medium underline hover:no-underline"
            >
              Retry
            </button>
          )}
          {onDismiss && (
            <button
              onClick={() => onDismiss(transaction.id)}
              className="text-sm opacity-75 hover:opacity-100"
            >
              ×
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Legacy component for backward compatibility
interface LegacyTransactionStatusProps {
  transactionStatus: {
    loading: boolean;
    error: string | null;
    success: boolean;
  };
  onResetStatus: () => void;
}

export function LegacyTransactionStatusAlert({ transactionStatus, onResetStatus }: LegacyTransactionStatusProps) {
  if (!transactionStatus.error && !transactionStatus.success) {
    return null;
  }

  return (
    <>
      {transactionStatus.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-800">{transactionStatus.error}</span>
            </div>
            <button
              onClick={onResetStatus}
              className="text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {transactionStatus.success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-green-800">Transaction completed successfully!</span>
            </div>
            <button
              onClick={onResetStatus}
              className="text-green-600 hover:text-green-800"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
}