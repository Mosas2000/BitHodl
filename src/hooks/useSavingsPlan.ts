import { useState, useCallback } from 'react';
import { 
  SavingsPlanForm, 
  SavingsPlanState, 
  SavingsPlanCalculation, 
  FormValidationError,
  FrequencyType,
  TokenType 
} from '@/types';

const INITIAL_FORM_STATE: SavingsPlanForm = {
  amount: '',
  tokenType: 'STX',
  frequency: 'Monthly',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  targetAmount: '',
};

const INITIAL_STATE: SavingsPlanState = {
  currentStep: 'form',
  formData: INITIAL_FORM_STATE,
  calculation: null,
  errors: [],
  isSubmitting: false,
};

// Frequency to days conversion
const FREQUENCY_TO_DAYS: Record<FrequencyType, number> = {
  Daily: 1,
  Weekly: 7,
  Biweekly: 14,
  Monthly: 30,
};

// Approximate blocks per day (Stacks blockchain produces ~144 blocks per day)
const BLOCKS_PER_DAY = 144;

// Fee structure (in microSTX)
const FEES = {
  CREATION: 1000, // 0.001 STX
  TRANSACTION: 500, // 0.0005 STX per transaction
};

// Interest rates (annual percentage rate)
const INTEREST_RATES: Record<TokenType, number> = {
  STX: 5.0, // 5% APY
  sBTC: 3.5, // 3.5% APY
};

export function useSavingsPlan() {
  const [state, setState] = useState<SavingsPlanState>(INITIAL_STATE);

  // Validate form fields
  const validateForm = useCallback((formData: SavingsPlanForm): FormValidationError[] => {
    const errors: FormValidationError[] = [];

    // Validate amount
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      errors.push({ field: 'amount', message: 'Amount must be greater than 0' });
    } else if (parseFloat(formData.amount) > 1000000) {
      errors.push({ field: 'amount', message: 'Amount cannot exceed 1,000,000' });
    }

    // Validate start date
    if (!formData.startDate) {
      errors.push({ field: 'startDate', message: 'Start date is required' });
    } else {
      const startDate = new Date(formData.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (startDate < today) {
        errors.push({ field: 'startDate', message: 'Start date cannot be in the past' });
      }
    }

    // Validate end date if provided
    if (formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      if (endDate <= startDate) {
        errors.push({ field: 'endDate', message: 'End date must be after start date' });
      }
    }

    // Validate target amount if provided
    if (formData.targetAmount && parseFloat(formData.targetAmount) <= 0) {
      errors.push({ field: 'targetAmount', message: 'Target amount must be greater than 0' });
    }

    // Validate that either end date or target amount is provided
    if (!formData.endDate && !formData.targetAmount) {
      errors.push({ 
        field: 'endDate', 
        message: 'Either end date or target amount must be specified' 
      });
    }

    return errors;
  }, []);

  // Calculate savings plan projections
  const calculateSavings = useCallback((formData: SavingsPlanForm): SavingsPlanCalculation => {
    const amount = parseFloat(formData.amount);
    const frequencyDays = FREQUENCY_TO_DAYS[formData.frequency];
    const startDate = new Date(formData.startDate);
    const endDate = formData.endDate ? new Date(formData.endDate) : null;
    const targetAmount = formData.targetAmount ? parseFloat(formData.targetAmount) : null;

    let totalMonths = 0;
    let contributionCount = 0;

    // Calculate duration and contribution count
    if (endDate) {
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      totalMonths = diffDays / 30;
      contributionCount = Math.floor(diffDays / frequencyDays);
    } else if (targetAmount) {
      contributionCount = Math.ceil(targetAmount / amount);
      totalMonths = (contributionCount * frequencyDays) / 30;
    }

    // Calculate total contributions
    const totalContributions = amount * contributionCount;

    // Calculate estimated earnings based on interest rate
    const annualRate = INTEREST_RATES[formData.tokenType] / 100;
    const monthlyRate = annualRate / 12;
    let estimatedEarnings = 0;

    // Simple interest calculation for each contribution
    for (let i = 0; i < contributionCount; i++) {
      const monthsRemaining = totalMonths - (i * frequencyDays / 30);
      estimatedEarnings += amount * monthlyRate * monthsRemaining;
    }

    // Calculate fees
    const fees = FEES.CREATION + (contributionCount * FEES.TRANSACTION);

    // Calculate estimated value
    const estimatedValue = totalContributions + estimatedEarnings - fees;

    return {
      totalContributions,
      estimatedValue,
      estimatedEarnings,
      totalMonths,
      contributionCount,
      fees,
    };
  }, []);

  // Update form field
  const updateFormField = useCallback((field: keyof SavingsPlanForm, value: string) => {
    setState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        [field]: value,
      },
      errors: prev.errors.filter(error => error.field !== field),
    }));
  }, []);

  // Validate and proceed to preview
  const proceedToPreview = useCallback(() => {
    const errors = validateForm(state.formData);
    
    if (errors.length > 0) {
      setState(prev => ({
        ...prev,
        errors,
      }));
      return false;
    }

    const calculation = calculateSavings(state.formData);
    
    setState(prev => ({
      ...prev,
      currentStep: 'preview',
      calculation,
      errors: [],
    }));
    
    return true;
  }, [state.formData, validateForm, calculateSavings]);

  // Go back to form
  const backToForm = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: 'form',
    }));
  }, []);

  // Proceed to confirmation
  const proceedToConfirmation = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: 'confirmation',
    }));
  }, []);

  // Submit savings plan
  const submitSavingsPlan = useCallback(async () => {
    setState(prev => ({
      ...prev,
      isSubmitting: true,
    }));

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setState(prev => ({
        ...prev,
        currentStep: 'success',
        isSubmitting: false,
      }));
      
      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isSubmitting: false,
        errors: [{ field: 'amount', message: 'Failed to create savings plan. Please try again.' }],
      }));
      return false;
    }
  }, []);

  // Reset form
  const resetForm = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  // Get frequency in blocks for smart contract
  const getFrequencyInBlocks = useCallback((frequency: FrequencyType): number => {
    return FREQUENCY_TO_DAYS[frequency] * BLOCKS_PER_DAY;
  }, []);

  return {
    state,
    updateFormField,
    proceedToPreview,
    backToForm,
    proceedToConfirmation,
    submitSavingsPlan,
    resetForm,
    getFrequencyInBlocks,
    validateForm,
  };
}