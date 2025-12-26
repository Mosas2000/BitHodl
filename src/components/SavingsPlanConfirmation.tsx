import { useState } from 'react';
import { SavingsPlanForm, SavingsPlanCalculation } from '@/types';
import { formatSTX, microSTXToSTX } from '@/utils/stacks';

interface SavingsPlanConfirmationProps {
  formData: SavingsPlanForm;
  calculation: SavingsPlanCalculation;
  onBack: () => void;
  onConfirm: () => Promise<boolean>;
  isSubmitting: boolean;
}

export function SavingsPlanConfirmation({ 
  formData, 
  calculation, 
  onBack, 
  onConfirm,
  isSubmitting 
}: SavingsPlanConfirmationProps) {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!agreedToTerms) {
      setError('You must agree to the terms and conditions to proceed.');
      return;
    }

    setError(null);
    const success = await onConfirm();
    if (!success) {
      setError('Failed to create savings plan. Please try again.');
    }
  };

  const getFrequencyText = (frequency: string): string => {
    switch (frequency) {
      case 'Daily':
        return 'Daily';
      case 'Weekly':
        return 'Weekly';
      case 'Biweekly':
        return 'Every 2 weeks';
      case 'Monthly':
        return 'Monthly';
      default:
        return frequency;
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Confirm Savings Plan</h2>
      
      {/* Transaction Details */}
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">Transaction Details</h3>
          <p className="text-sm text-yellow-700 mb-4">
            Please review the details below carefully. This transaction will be submitted to the Stacks blockchain.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-yellow-700">Plan Type:</span>
              <span className="ml-2 font-medium text-yellow-900">
                {formData.tokenType} Savings Plan
              </span>
            </div>
            <div>
              <span className="text-yellow-700">Amount:</span>
              <span className="ml-2 font-medium text-yellow-900">
                {formatSTX(parseFloat(formData.amount), 6)} {formData.tokenType}
              </span>
            </div>
            <div>
              <span className="text-yellow-700">Frequency:</span>
              <span className="ml-2 font-medium text-yellow-900">
                {getFrequencyText(formData.frequency)}
              </span>
            </div>
            <div>
              <span className="text-yellow-700">Start Date:</span>
              <span className="ml-2 font-medium text-yellow-900">
                {formatDate(formData.startDate)}
              </span>
            </div>
            {formData.endDate && (
              <div>
                <span className="text-yellow-700">End Date:</span>
                <span className="ml-2 font-medium text-yellow-900">
                  {formatDate(formData.endDate)}
                </span>
              </div>
            )}
            {formData.targetAmount && (
              <div>
                <span className="text-yellow-700">Target Amount:</span>
                <span className="ml-2 font-medium text-yellow-900">
                  {formatSTX(parseFloat(formData.targetAmount), 6)} {formData.tokenType}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Fee Breakdown */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Fee Breakdown</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Plan Creation Fee:</span>
              <span className="font-medium text-gray-900">
                {formatSTX(microSTXToSTX(1000), 6)} STX
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Transaction Fees ({calculation.contributionCount} payments):</span>
              <span className="font-medium text-gray-900">
                {formatSTX(microSTXToSTX(calculation.contributionCount * 500), 6)} STX
              </span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between">
                <span className="font-medium text-gray-900">Total Fees:</span>
                <span className="font-bold text-gray-900">
                  {formatSTX(microSTXToSTX(calculation.fees), 6)} STX
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Wallet Connection Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Wallet Connection Required</p>
              <p>You will be prompted to confirm this transaction in your Stacks wallet. Make sure you have sufficient funds to cover the plan amount and fees.</p>
            </div>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Terms and Conditions</h3>
          <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-40 overflow-y-auto">
            <div className="text-sm text-gray-600 space-y-2">
              <p>By creating this savings plan, you agree to the following terms:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Automatic payments will be processed according to your selected frequency</li>
                <li>Transaction fees are deducted from your savings balance</li>
                <li>Interest rates are variable and may change over time</li>
                <li>You can pause, modify, or cancel your plan at any time</li>
                <li>All transactions are recorded on the Stacks blockchain and are irreversible</li>
                <li>You are responsible for maintaining sufficient balance in your wallet</li>
                <li>The smart contract will execute transactions automatically based on the plan parameters</li>
              </ul>
            </div>
          </div>
          
          <div className="flex items-start">
            <input
              type="checkbox"
              id="terms"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={isSubmitting}
            />
            <label htmlFor="terms" className="ml-2 text-sm text-gray-700">
              I have read and agree to the terms and conditions, and I understand that this transaction will be submitted to the blockchain.
            </label>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6">
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Back to Preview
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !agreedToTerms}
            className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting Transaction...
              </span>
            ) : (
              'Create Savings Plan'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}