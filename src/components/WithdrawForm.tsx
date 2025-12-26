import React, { useState } from 'react';
import { validateSTXAmount } from '@/utils/stacks';
import { TransactionDetails } from '@/types';

interface WithdrawFormProps {
  onWithdraw: (amount: number) => Promise<void>;
  isLoading: boolean;
  disabled: boolean;
  availableBalance: number;
  currentTransaction?: TransactionDetails | null;
}

export function WithdrawForm({ onWithdraw, isLoading, disabled, availableBalance, currentTransaction }: WithdrawFormProps) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const isTransactionActive = currentTransaction &&
    (currentTransaction.state === 'pending' || currentTransaction.state === 'broadcasting') &&
    currentTransaction.type === 'withdraw';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateSTXAmount(amount)) {
      setError('Please enter a valid STX amount');
      return;
    }

    const amountNum = parseFloat(amount);
    if (amountNum > availableBalance) {
      setError('Amount exceeds available balance');
      return;
    }

    setError('');
    await onWithdraw(amountNum);
    setAmount('');
  };

  const getButtonText = () => {
    if (isTransactionActive) {
      switch (currentTransaction.state) {
        case 'pending':
          return 'Preparing Transaction...';
        case 'broadcasting':
          return 'Broadcasting...';
        default:
          return 'Processing...';
      }
    }
    
    if (isLoading) return 'Processing...';
    return 'Withdraw';
  };

  const isDisabled = disabled || isLoading || isTransactionActive || !amount || parseFloat(amount) > availableBalance;

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">Withdraw STX</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="withdraw-amount" className="block text-sm font-medium text-gray-700 mb-1">
            Amount in STX
          </label>
          <input
            id="withdraw-amount"
            type="number"
            step="0.000001"
            placeholder="0.000000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-stacks-blue focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-800 transition-all duration-200"
            disabled={isDisabled}
            max={availableBalance}
            aria-describedby="withdraw-error withdraw-balance"
            aria-invalid={!!error}
          />
          {error && (
            <p id="withdraw-error" className="text-red-600 dark:text-red-400 text-sm mt-1" role="alert">{error}</p>
          )}
          <p id="withdraw-balance" className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Available: {availableBalance.toFixed(6)} STX
          </p>
        </div>
        
        <button
          type="submit"
          disabled={isDisabled}
          className="w-full btn-secondary disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-900 transform hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
          aria-describedby="withdraw-error withdraw-balance"
        >
          {(isTransactionActive || isLoading) ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-800 mr-2"></div>
              {getButtonText()}
            </div>
          ) : (
            'Withdraw'
          )}
        </button>

        {isTransactionActive && currentTransaction.txId && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              Transaction {currentTransaction.txId.slice(0, 10)}...{currentTransaction.txId.slice(-8)} is being processed
            </p>
            <a
              href={`https://explorer.stacks.co/txid/${currentTransaction.txId}?chain=mainnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 underline hover:no-underline mt-1 inline-block"
            >
              View in Explorer
            </a>
          </div>
        )}
      </form>
    </div>
  );
}