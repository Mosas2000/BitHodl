import { SavingsPlanForm, SavingsPlanCalculation, TokenType } from '@/types';
import { formatSTX, microSTXToSTX } from '@/utils/stacks';

interface SavingsPlanPreviewProps {
  formData: SavingsPlanForm;
  calculation: SavingsPlanCalculation;
  onEdit: () => void;
  onConfirm: () => void;
}

export function SavingsPlanPreview({ 
  formData, 
  calculation, 
  onEdit, 
  onConfirm 
}: SavingsPlanPreviewProps) {
  // Mock conversion rates for display purposes
  const CONVERSION_RATES: Record<TokenType, number> = {
    STX: 2.5, // $2.50 per STX
    sBTC: 45000, // $45,000 per sBTC
  };

  const conversionRate = CONVERSION_RATES[formData.tokenType];
  const totalContributionsUSD = calculation.totalContributions * conversionRate;
  const estimatedValueUSD = calculation.estimatedValue * conversionRate;
  const estimatedEarningsUSD = calculation.estimatedEarnings * conversionRate;
  const feesUSD = calculation.fees / 1000000 * CONVERSION_RATES.STX; // Convert microSTX to STX then to USD

  const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    if (currency === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    }
    return amount.toFixed(6);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getFrequencyText = (frequency: string): string => {
    switch (frequency) {
      case 'Daily':
        return 'day';
      case 'Weekly':
        return 'week';
      case 'Biweekly':
        return '2 weeks';
      case 'Monthly':
        return 'month';
      default:
        return frequency;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Savings Plan Preview</h2>
      
      {/* Plan Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Plan Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-blue-700">Amount:</span>
            <span className="ml-2 font-medium text-blue-900">
              {formatSTX(parseFloat(formData.amount), 6)} {formData.tokenType}
            </span>
          </div>
          <div>
            <span className="text-blue-700">Frequency:</span>
            <span className="ml-2 font-medium text-blue-900">
              {formData.frequency}
            </span>
          </div>
          <div>
            <span className="text-blue-700">Start Date:</span>
            <span className="ml-2 font-medium text-blue-900">
              {formatDate(formData.startDate)}
            </span>
          </div>
          {formData.endDate && (
            <div>
              <span className="text-blue-700">End Date:</span>
              <span className="ml-2 font-medium text-blue-900">
                {formatDate(formData.endDate)}
              </span>
            </div>
          )}
          {formData.targetAmount && (
            <div>
              <span className="text-blue-700">Target Amount:</span>
              <span className="ml-2 font-medium text-blue-900">
                {formatSTX(parseFloat(formData.targetAmount), 6)} {formData.tokenType}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Projections */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Projected Savings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Total Contributions */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Total Contributions</span>
              <span className="text-xs text-gray-500">
                {calculation.contributionCount} payments
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-gray-900">
                {formatSTX(calculation.totalContributions, 6)} {formData.tokenType}
              </div>
              <div className="text-sm text-gray-500">
                {formatCurrency(totalContributionsUSD)}
              </div>
            </div>
          </div>

          {/* Estimated Value */}
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-600">Estimated Value</span>
              <span className="text-xs text-green-500">
                After {calculation.totalMonths.toFixed(1)} months
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-green-900">
                {formatSTX(calculation.estimatedValue, 6)} {formData.tokenType}
              </div>
              <div className="text-sm text-green-600">
                {formatCurrency(estimatedValueUSD)}
              </div>
            </div>
          </div>

          {/* Estimated Earnings */}
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-purple-600">Estimated Earnings</span>
              <span className="text-xs text-purple-500">
                {formData.tokenType === 'STX' ? '5% APY' : '3.5% APY'}
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-purple-900">
                {formatSTX(calculation.estimatedEarnings, 6)} {formData.tokenType}
              </div>
              <div className="text-sm text-purple-600">
                {formatCurrency(estimatedEarningsUSD)}
              </div>
            </div>
          </div>

          {/* Fees */}
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-red-600">Total Fees</span>
              <span className="text-xs text-red-500">
                Creation + transactions
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-red-900">
                {formatSTX(microSTXToSTX(calculation.fees), 6)} STX
              </div>
              <div className="text-sm text-red-600">
                {formatCurrency(feesUSD)}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Schedule */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Schedule</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Payment Amount:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {formatSTX(parseFloat(formData.amount), 6)} {formData.tokenType}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Frequency:</span>
                <span className="ml-2 font-medium text-gray-900">
                  Every {getFrequencyText(formData.frequency)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Total Payments:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {calculation.contributionCount}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Important Notes</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p>Projected earnings are estimates based on current interest rates and may vary over time.</p>
            </div>
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p>Transaction fees are deducted from your savings and may vary based on network conditions.</p>
            </div>
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p>You can pause, modify, or cancel your savings plan at any time.</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6">
          <button
            type="button"
            onClick={onEdit}
            className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Edit Plan
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Confirm Plan
          </button>
        </div>
      </div>
    </div>
  );
}