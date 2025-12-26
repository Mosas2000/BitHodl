import { useEffect } from 'react';
import { useSavingsPlan } from '@/hooks/useSavingsPlan';
import { useSavingsContract } from '@/hooks/useSavingsContract';
import { SavingsPlanForm } from '@/components/SavingsPlanForm';
import { SavingsPlanPreview } from '@/components/SavingsPlanPreview';
import { SavingsPlanConfirmation } from '@/components/SavingsPlanConfirmation';
import { StacksUser } from '@/types';

interface SavingsPlanCreatorProps {
  user: StacksUser | null;
  onClose?: () => void;
}

export function SavingsPlanCreator({ user, onClose }: SavingsPlanCreatorProps) {
  const { 
    state, 
    updateFormField, 
    proceedToPreview, 
    backToForm, 
    proceedToConfirmation, 
    resetForm,
    getFrequencyInBlocks 
  } = useSavingsPlan();

  const { createSavingsPlan, transactionStatus, resetTransactionStatus } = useSavingsContract(user?.address || null);

  // Handle successful transaction
  useEffect(() => {
    if (transactionStatus.success) {
      // Reset form after successful submission
      setTimeout(() => {
        resetForm();
        resetTransactionStatus();
        onClose?.();
      }, 3000);
    }
  }, [transactionStatus.success, resetForm, resetTransactionStatus, onClose]);

  const handleSubmitPlan = async (): Promise<boolean> => {
    if (!user) {
      return false;
    }

    try {
      // Convert form data to contract parameters
      const targetAmount = parseFloat(state.formData.amount);
      const frequencyInBlocks = getFrequencyInBlocks(state.formData.frequency);
      
      // Calculate deadline (end date or target amount)
      let deadline = 0;
      if (state.formData.endDate) {
        const endDate = new Date(state.formData.endDate);
        const startDate = new Date(state.formData.startDate);
        const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        deadline = diffDays * 144; // Convert days to blocks (144 blocks per day)
      } else if (state.formData.targetAmount) {
        // If target amount is specified, calculate how many periods needed
        const targetAmountFloat = parseFloat(state.formData.targetAmount);
        const periodsNeeded = Math.ceil(targetAmountFloat / targetAmount);
        deadline = periodsNeeded * frequencyInBlocks;
      }

      // Call the contract function
      await createSavingsPlan(targetAmount, deadline);
      return true;
    } catch (error) {
      console.error('Error creating savings plan:', error);
      return false;
    }
  };

  const handleBack = () => {
    if (state.currentStep === 'preview') {
      backToForm();
    } else if (state.currentStep === 'confirmation') {
      // Go back to preview
      // We need to recalculate since we might have modified the form
      proceedToPreview();
    }
  };

  const handleClose = () => {
    if (state.currentStep === 'form') {
      onClose?.();
    } else {
      // Show confirmation dialog if in the middle of the flow
      if (window.confirm('Are you sure you want to cancel? Your progress will be lost.')) {
        resetForm();
        onClose?.();
      }
    }
  };

  // Render success state
  if (state.currentStep === 'success') {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="text-center py-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Savings Plan Created!</h2>
          <p className="text-gray-600 mb-6">
            Your savings plan has been successfully created and will start on {new Date(state.formData.startDate).toLocaleDateString()}.
          </p>
          <button
            onClick={handleClose}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Create Savings Plan</h1>
        {onClose && (
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        )}
      </div>

      {/* Progress Indicator */}
      {(state.currentStep === 'preview' || state.currentStep === 'confirmation') && (
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-600 text-white">
                ✓
              </div>
              <span className="ml-2 text-sm font-medium text-green-600">
                Plan Details
              </span>
            </div>
            
            <div className="flex-1 h-1 mx-4 bg-green-600"></div>
            
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                state.currentStep === 'preview' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
              }`}>
                {state.currentStep === 'preview' ? '2' : '✓'}
              </div>
              <span className={`ml-2 text-sm font-medium ${
                state.currentStep === 'preview' ? 'text-blue-600' : 'text-green-600'
              }`}>
                Preview
              </span>
            </div>
            
            <div className={`flex-1 h-1 mx-4 ${
              state.currentStep === 'confirmation' ? 'bg-green-600' : 'bg-gray-200'
            }`}></div>
            
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                state.currentStep === 'confirmation' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                3
              </div>
              <span className={`ml-2 text-sm font-medium ${
                state.currentStep === 'confirmation' ? 'text-blue-600' : 'text-gray-500'
              }`}>
                Confirm
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {transactionStatus.error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800">Transaction Error</h3>
              <p className="mt-1 text-sm text-red-700">{transactionStatus.error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Form Content */}
      {state.currentStep === 'form' && (
        <SavingsPlanForm
          formData={state.formData}
          errors={state.errors}
          onFieldChange={updateFormField}
          onSubmit={proceedToPreview}
          isSubmitting={transactionStatus.loading}
        />
      )}

      {/* Preview Content */}
      {state.currentStep === 'preview' && state.calculation && (
        <SavingsPlanPreview
          formData={state.formData}
          calculation={state.calculation}
          onEdit={backToForm}
          onConfirm={proceedToConfirmation}
        />
      )}

      {/* Confirmation Content */}
      {state.currentStep === 'confirmation' && state.calculation && (
        <SavingsPlanConfirmation
          formData={state.formData}
          calculation={state.calculation}
          onBack={handleBack}
          onConfirm={handleSubmitPlan}
          isSubmitting={transactionStatus.loading}
        />
      )}
    </div>
  );
}