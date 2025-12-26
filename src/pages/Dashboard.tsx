import { useState } from 'react';
import { useAppKitWallet } from '@/hooks/useAppKitWallet';
import { useSavingsContract } from '@/hooks/useSavingsContract';
import { MainDashboard } from '@/components/MainDashboard';
import { TransactionForm } from '@/components/TransactionForm';
import { LegacyTransactionStatusAlert } from '@/components/TransactionStatus';

export function Dashboard() {
  const { user, isConnected, error: walletError, getErrorMessage: getWalletErrorMessage } = useAppKitWallet();
  const { contractState, transactionStatus, resetTransactionStatus, contractError } = useSavingsContract(user?.address || null);
  const [showTransactionForm] = useState(false);

  return (
    <div className="space-y-6">
      {/* Wallet Connection Error Alert */}
      {walletError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Wallet Connection Issue
              </h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                {getWalletErrorMessage() || 'Please connect your wallet using AppKit to continue'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Contract Error Alert */}
      {contractError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Contract Interaction Error
              </h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                {contractError.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Status Alert */}
      <LegacyTransactionStatusAlert
        transactionStatus={transactionStatus}
        onResetStatus={resetTransactionStatus}
      />

      {/* Main Dashboard */}
      <MainDashboard
        contractState={contractState}
        isBalanceLoading={false}
        user={user}
      />

      {/* Transaction Form */}
      {showTransactionForm && isConnected && (
        <div id="transaction-form">
          <TransactionForm userAddress={user?.address || null} />
        </div>
      )}

      {/* Wallet Not Connected Message */}
      {!isConnected && (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Wallet Not Connected
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Please connect your wallet using AppKit to interact with the savings contract.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
