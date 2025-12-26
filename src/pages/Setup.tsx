import React, { useState } from 'react';
import { useAppKitWallet } from '@/hooks/useAppKitWallet';
import { useSavingsContract } from '@/hooks/useSavingsContract';
import { validateSTXAmount } from '@/utils/stacks';
import { LegacyTransactionStatusAlert } from '@/components/TransactionStatus';

export function Setup() {
  const { user, balance, isConnected, error: walletError, getErrorMessage: getWalletErrorMessage } = useAppKitWallet();
  const { createSavingsPlan, transactionStatus, resetTransactionStatus, contractError } = useSavingsContract(user?.address || null);
  
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [autoDeposit, setAutoDeposit] = useState(false);
  const [depositFrequency, setDepositFrequency] = useState('weekly');
  const [depositAmount, setDepositAmount] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!validateSTXAmount(targetAmount)) {
      newErrors.targetAmount = 'Please enter a valid target amount';
    }
    
    if (!deadline) {
      newErrors.deadline = 'Please select a deadline';
    } else {
      const deadlineDate = new Date(deadline);
      const today = new Date();
      if (deadlineDate <= today) {
        newErrors.deadline = 'Deadline must be in the future';
      }
    }
    
    if (autoDeposit && !validateSTXAmount(depositAmount)) {
      newErrors.depositAmount = 'Please enter a valid deposit amount';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const deadlineTimestamp = Math.floor(new Date(deadline).getTime() / 1000);
    await createSavingsPlan(parseFloat(targetAmount), deadlineTimestamp);
  };

  const balanceSTX = balance / 1000000; // Convert from microSTX

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Savings Plan</h1>
        <p className="text-lg text-gray-600">Set up a new savings goal and track your progress</p>
      </div>

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

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Target Amount */}
          <div>
            <label htmlFor="target-amount" className="block text-sm font-medium text-gray-700 mb-1">
              Target Amount (STX)
            </label>
            <input
              id="target-amount"
              type="number"
              step="0.000001"
              placeholder="0.000000"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-stacks-blue focus:border-transparent"
              disabled={!isConnected || transactionStatus.loading}
            />
            {errors.targetAmount && (
              <p className="text-red-600 text-sm mt-1">{errors.targetAmount}</p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              Available balance: {balanceSTX.toFixed(6)} STX
            </p>
          </div>

          {/* Deadline */}
          <div>
            <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">
              Target Date
            </label>
            <input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-stacks-blue focus:border-transparent"
              disabled={!isConnected || transactionStatus.loading}
            />
            {errors.deadline && (
              <p className="text-red-600 text-sm mt-1">{errors.deadline}</p>
            )}
          </div>

          {/* Auto-Deposit Option */}
          <div className="border-t pt-6">
            <div className="flex items-center mb-4">
              <input
                id="auto-deposit"
                type="checkbox"
                checked={autoDeposit}
                onChange={(e) => setAutoDeposit(e.target.checked)}
                className="h-4 w-4 text-stacks-blue focus:ring-stacks-blue border-gray-300 rounded"
                disabled={!isConnected || transactionStatus.loading}
              />
              <label htmlFor="auto-deposit" className="ml-2 block text-sm text-gray-900">
                Enable automatic deposits
              </label>
            </div>

            {autoDeposit && (
              <div className="space-y-4 pl-6 border-l-2 border-gray-200">
                {/* Deposit Frequency */}
                <div>
                  <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-1">
                    Deposit Frequency
                  </label>
                  <select
                    id="frequency"
                    value={depositFrequency}
                    onChange={(e) => setDepositFrequency(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-stacks-blue focus:border-transparent"
                    disabled={!isConnected || transactionStatus.loading}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                {/* Deposit Amount */}
                <div>
                  <label htmlFor="deposit-amount" className="block text-sm font-medium text-gray-700 mb-1">
                    Deposit Amount (STX)
                  </label>
                  <input
                    id="deposit-amount"
                    type="number"
                    step="0.000001"
                    placeholder="0.000000"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-stacks-blue focus:border-transparent"
                    disabled={!isConnected || transactionStatus.loading}
                  />
                  {errors.depositAmount && (
                    <p className="text-red-600 text-sm mt-1">{errors.depositAmount}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Plan Summary */}
          {targetAmount && deadline && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Plan Summary</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Target Amount:</span>
                  <span className="font-medium">{targetAmount} STX</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Target Date:</span>
                  <span className="font-medium">{new Date(deadline).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Days to Target:</span>
                  <span className="font-medium">
                    {Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
                  </span>
                </div>
                {autoDeposit && depositAmount && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Required Deposits:</span>
                    <span className="font-medium">
                      {Math.ceil(parseFloat(targetAmount) / parseFloat(depositAmount))}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isConnected || transactionStatus.loading || !targetAmount || !deadline}
            className="w-full btn-primary py-3 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {transactionStatus.loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating Plan...
              </div>
            ) : (
              'Create Savings Plan'
            )}
          </button>
        </form>
      </div>

      {/* Tips */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="font-medium text-blue-900 mb-2">💡 Savings Tips</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Start with a realistic target amount you can achieve</li>
          <li>• Set a deadline that motivates you but is achievable</li>
          <li>• Enable auto-deposits to maintain consistent savings</li>
          <li>• Review and adjust your plan as needed</li>
        </ul>
      </div>

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
              Please connect your wallet using AppKit to create a savings plan.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}