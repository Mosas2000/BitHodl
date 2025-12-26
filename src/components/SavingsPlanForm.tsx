import { useState } from 'react';
import type { SavingsPlanForm } from '@/types';
import { FormValidationError, TokenType, FrequencyType } from '@/types';

interface SavingsPlanFormProps {
  formData: SavingsPlanForm;
  errors: FormValidationError[];
  onFieldChange: (field: keyof SavingsPlanForm, value: string) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

export function SavingsPlanForm({ 
  formData, 
  errors, 
  onFieldChange, 
  onSubmit, 
  isSubmitting = false 
}: SavingsPlanFormProps) {
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  const getErrorForField = (field: keyof SavingsPlanForm): string | null => {
    const error = errors.find(e => e.field === field);
    return error ? error.message : null;
  };

  const tokenOptions: { value: TokenType; label: string; description: string }[] = [
    { 
      value: 'STX',
      label: 'STX',
      description: 'BitHodl native token with 5% APY'
    },
    { 
      value: 'sBTC',
      label: 'sBTC',
      description: 'Bitcoin on Stacks with 3.5% APY via BitHodl'
    },
  ];

  const frequencyOptions: { value: FrequencyType; label: string }[] = [
    { value: 'Daily', label: 'Daily' },
    { value: 'Weekly', label: 'Weekly' },
    { value: 'Biweekly', label: 'Biweekly' },
    { value: 'Monthly', label: 'Monthly' },
  ];

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const handleAmountChange = (value: string) => {
    // Only allow numbers and decimal point
    const sanitizedValue = value.replace(/[^0-9.]/g, '');
    // Ensure only one decimal point
    const parts = sanitizedValue.split('.');
    if (parts.length > 2) {
      return;
    }
    // Limit to 8 decimal places
    if (parts[1] && parts[1].length > 8) {
      return;
    }
    onFieldChange('amount', sanitizedValue);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Savings Plan</h2>
      
      <div className="space-y-6">
        {/* Amount and Token Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Amount to Save
            </label>
            <div className="relative">
              <input
                type="text"
                id="amount"
                value={formData.amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0.00"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  getErrorForField('amount') 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-500 text-sm">{formData.tokenType}</span>
              </div>
            </div>
            {getErrorForField('amount') && (
              <p className="mt-1 text-sm text-red-600">{getErrorForField('amount')}</p>
            )}
          </div>

          <div>
            <label htmlFor="tokenType" className="block text-sm font-medium text-gray-700 mb-2">
              Token Type
            </label>
            <select
              id="tokenType"
              value={formData.tokenType}
              onChange={(e) => onFieldChange('tokenType', e.target.value as TokenType)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isSubmitting}
            >
              {tokenOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              {tokenOptions.find(opt => opt.value === formData.tokenType)?.description}
            </p>
          </div>
        </div>

        {/* Frequency */}
        <div>
          <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-2">
            Savings Frequency
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {frequencyOptions.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => onFieldChange('frequency', option.value)}
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                  formData.frequency === option.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                disabled={isSubmitting}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Start Date */}
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
            Start Date
          </label>
          <input
            type="date"
            id="startDate"
            value={formData.startDate}
            onChange={(e) => onFieldChange('startDate', e.target.value)}
            min={getMinDate()}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              getErrorForField('startDate') 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-300'
            }`}
            disabled={isSubmitting}
          />
          {getErrorForField('startDate') && (
            <p className="mt-1 text-sm text-red-600">{getErrorForField('startDate')}</p>
          )}
        </div>

        {/* Advanced Options Toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <svg
              className={`w-4 h-4 mr-2 transition-transform ${
                showAdvancedOptions ? 'rotate-90' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            {showAdvancedOptions ? 'Hide' : 'Show'} Advanced Options
          </button>
        </div>

        {/* Advanced Options */}
        {showAdvancedOptions && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={formData.endDate}
                  onChange={(e) => onFieldChange('endDate', e.target.value)}
                  min={formData.startDate}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    getErrorForField('endDate') 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300'
                  }`}
                  disabled={isSubmitting}
                />
                {getErrorForField('endDate') && (
                  <p className="mt-1 text-sm text-red-600">{getErrorForField('endDate')}</p>
                )}
              </div>

              <div>
                <label htmlFor="targetAmount" className="block text-sm font-medium text-gray-700 mb-2">
                  Target Amount (Optional)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="targetAmount"
                    value={formData.targetAmount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0.00"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      getErrorForField('targetAmount') 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-gray-300'
                    }`}
                    disabled={isSubmitting}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-500 text-sm">{formData.tokenType}</span>
                  </div>
                </div>
                {getErrorForField('targetAmount') && (
                  <p className="mt-1 text-sm text-red-600">{getErrorForField('targetAmount')}</p>
                )}
              </div>
            </div>

            <div className="text-sm text-gray-600">
              <p className="font-medium mb-1">Note:</p>
              <p>You must specify either an end date or a target amount. If both are provided, the plan will end when either condition is met.</p>
            </div>
          </div>
        )}

        {/* General Error Message */}
        {errors.some(e => e.field === 'endDate' && e.message.includes('Either end date or target amount')) && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">
              {errors.find(e => e.field === 'endDate')?.message}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting || !formData.amount}
            className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              'Preview Savings Plan'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}