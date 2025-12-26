import { useState, useEffect, useCallback } from 'react';
import { ContractState, TransactionStatus, UserDeposit, SavingsPlan, FrequencyType, SavingsTransaction } from '@/types';
import { getContractAddress, CONTRACT_NAME, stxToMicroSTX, getStacksNetwork } from '@/utils/stacks';
import { openContractCall } from '@stacks/connect';
import { uintCV } from '@stacks/transactions';
import { useTransactionFlow } from './useTransactionFlow';
import { useToast } from './useToast';
import { useAppKitWallet } from './useAppKitWallet';
import {
  AppError,
  ErrorType,
  createError,
  getErrorMessage,
  isRetryableError,
  requiresReconnection
} from '@/utils/errors';

export function useSavingsContract(userAddress: string | null) {
  // Get AppKit wallet connection state
  const {
    isConnected: isAppKitConnected,
    address: appKitAddress,
    balance: appKitBalance,
    signTransaction: appKitSignTransaction,
    error: appKitError,
    getErrorMessage: getAppKitErrorMessage,
    requiresReconnection: appKitRequiresReconnection,
    handleTransactionResponse: appKitHandleTransactionResponse
  } = useAppKitWallet();
  const [contractState, setContractState] = useState<ContractState>({
    totalDeposits: 0,
    interestRate: 5.0,
    userBalance: 0,
    userDeposit: null,
  });
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>({
    loading: false,
    error: null,
    success: false,
  });
  const [transactionHistory, setTransactionHistory] = useState<SavingsTransaction[]>([]);
  const [savingsPlan, setSavingsPlan] = useState<SavingsPlan | null>(null);
  const [contractError, setContractError] = useState<AppError | null>(null);

  const contractAddress = getContractAddress('mainnet');
  
  // New transaction flow system
  const {
    transactionFlow,
    startTransaction,
    setTransactionBroadcasting,
    setTransactionFailed,
    retryTransaction,
    clearCurrentTransaction
  } = useTransactionFlow();
  
  const { showSuccess, showError, showInfo, showWarning } = useToast();

  // Fetch contract state
  const fetchContractState = useCallback(async () => {
    // Prioritize AppKit address if available, otherwise fall back to passed userAddress
    const effectiveAddress = isAppKitConnected ? appKitAddress : userAddress;
    if (!effectiveAddress) return;

    try {
      // In a real implementation, you would fetch from the Stacks API
      // For now, we'll use mock data with more realistic values
      const mockUserDeposit: UserDeposit = {
        amount: 500000, // 0.5 STX in microSTX
        timestamp: Date.now() - 86400000 * 7, // 7 days ago
        interestEarned: 479, // Interest earned over 7 days at 5% APY
      };

      setContractState({
        totalDeposits: 10000000, // 10 STX in microSTX
        interestRate: 5.0,
        userBalance: mockUserDeposit.amount + mockUserDeposit.interestEarned,
        userDeposit: mockUserDeposit,
      });

      // Mock transaction history with enhanced data
      const now = Date.now();
      setTransactionHistory([
        {
          id: '0x1234567890abcdef',
          txHash: '0x1234567890abcdef1234567890abcdef12345678',
          type: 'deposit',
          amount: 500000,
          timestamp: now - 86400000 * 7,
          status: 'success',
          blockHeight: 12345,
          confirmations: 1000,
          fee: 250,
          stxBalance: 500250
        },
        {
          id: '0xabcdef1234567890',
          txHash: '0xabcdef1234567890abcdef1234567890abcdef12',
          type: 'dca-purchase',
          amount: 100000,
          timestamp: now - 86400000 * 6,
          status: 'success',
          blockHeight: 12389,
          confirmations: 956,
          fee: 200,
          btcPrice: 42000,
          stxBalance: 600450
        },
        {
          id: '0x7890abcdef123456',
          txHash: '0x7890abcdef1234567890abcdef1234567890abcd',
          type: 'dca-purchase',
          amount: 100000,
          timestamp: now - 86400000 * 5,
          status: 'success',
          blockHeight: 12433,
          confirmations: 912,
          fee: 200,
          btcPrice: 43500,
          stxBalance: 700650
        },
        {
          id: '0x234567890abcdef1',
          txHash: '0x234567890abcdef1234567890abcdef1234567890',
          type: 'interest',
          amount: 479,
          timestamp: now - 86400000 * 4,
          status: 'success',
          blockHeight: 12477,
          confirmations: 868,
          stxBalance: 701129
        },
        {
          id: '0x34567890abcdef12',
          txHash: '0x34567890abcdef1234567890abcdef12345678901',
          type: 'dca-purchase',
          amount: 100000,
          timestamp: now - 86400000 * 3,
          status: 'success',
          blockHeight: 12521,
          confirmations: 824,
          fee: 200,
          btcPrice: 41000,
          stxBalance: 801329
        },
        {
          id: '0x4567890abcdef123',
          txHash: '0x4567890abcdef1234567890abcdef123456789012',
          type: 'withdrawal',
          amount: 50000,
          timestamp: now - 86400000 * 2,
          status: 'success',
          blockHeight: 12565,
          confirmations: 780,
          fee: 300,
          stxBalance: 751029
        },
        {
          id: '0x567890abcdef1234',
          txHash: '0x567890abcdef1234567890abcdef1234567890123',
          type: 'dca-purchase',
          amount: 100000,
          timestamp: now - 86400000,
          status: 'pending',
          blockHeight: 12609,
          confirmations: 736,
          fee: 200,
          btcPrice: 44000,
          stxBalance: 851229
        }
      ]);
    } catch (error) {
      console.error('Failed to fetch contract state:', error);
    }
  }, [appKitAddress, userAddress]);

  // Deposit STX to contract with comprehensive error handling
  // Initiates transaction flow, converts amount to microSTX, and handles all transaction states
  const deposit = async (amount: number) => {
    // Check for AppKit wallet connection first
    if (!isAppKitConnected || !appKitAddress) {
      const error = createError(ErrorType.WALLET_NOT_CONNECTED);
      setContractError(error);
      showError('Wallet Not Connected', 'Please connect your wallet using AppKit to make deposits');
      return;
    }

    // Check if there's an AppKit connection error that requires reconnection
    if (appKitError && appKitRequiresReconnection()) {
      setContractError(appKitError);
      showError('Wallet Connection Issue', getAppKitErrorMessage() || 'Please reconnect your wallet');
      return;
    }

    // Validate balance using AppKit balance
    if (appKitBalance < amount) {
      const error = createError(ErrorType.INSUFFICIENT_BALANCE, {
        required: amount,
        available: appKitBalance,
        symbol: 'STX'
      });
      setContractError(error);
      showError('Insufficient Balance', getErrorMessage(error));
      return;
    }

    // Initialize transaction flow for tracking and user feedback
    const transaction = startTransaction('deposit', amount);
    showInfo('Deposit Initiated', `Preparing to deposit ${amount.toFixed(6)} STX`);

    try {
      // Convert STX to microSTX for contract compatibility
      const microAmount = stxToMicroSTX(amount);

      const network = getStacksNetwork('mainnet');
      const transactionOptions = {
        contractAddress,
        contractName: CONTRACT_NAME,
        functionName: 'deposit',
        functionArgs: [uintCV(microAmount)],
        network,
        appDetails: {
          name: 'Bitcoin Savings DApp',
          icon: window.location.origin + '/favicon.ico',
        },
      };

      // Use AppKit signTransaction if available
      if (appKitSignTransaction) {
        const result = await appKitSignTransaction(transactionOptions);
        if (result && appKitHandleTransactionResponse(result)) {
          const payload = result as any;
          // Update transaction state to broadcasting for UI feedback
          setTransactionBroadcasting(transaction.id, payload.txId);
          showSuccess('Deposit Broadcasted', `Transaction ${payload.txId.slice(0, 10)}... has been broadcasted`, {
            label: 'View in Explorer',
            onClick: () => window.open(`https://explorer.stacks.co/txid/${payload.txId}?chain=mainnet`, '_blank')
          });
        } else {
          // Handle failed transaction response
          setTransactionFailed(transaction.id, getAppKitErrorMessage() || 'Transaction failed');
          showError('Deposit Failed', getAppKitErrorMessage() || 'Transaction failed');
        }
      } else {
        // Fallback to openContractCall
        await openContractCall({
          ...transactionOptions,
          onFinish: (payload) => {
            if (payload.txId) {
              // Update transaction state to broadcasting for UI feedback
              setTransactionBroadcasting(transaction.id, payload.txId);
              showSuccess('Deposit Broadcasted', `Transaction ${payload.txId.slice(0, 10)}... has been broadcasted`, {
                label: 'View in Explorer',
                onClick: () => window.open(`https://explorer.stacks.co/txid/${payload.txId}?chain=mainnet`, '_blank')
              });
            }
          },
          onCancel: () => {
            // Handle user cancellation gracefully
            const error = createError(ErrorType.TRANSACTION_CANCELLED, { action: 'deposit' });
            setTransactionFailed(transaction.id, getErrorMessage(error));
            setContractError(error);
            showWarning('Deposit Cancelled', getErrorMessage(error));
          },
        });
      }
    } catch (error) {
      console.error('Deposit error:', error);
      
      // Categorize errors for appropriate user feedback
      let appError: AppError;
      if (error instanceof AppError) {
        appError = error;
      } else if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          appError = createError(ErrorType.USER_REJECTED);
        } else if (error.message.includes('insufficient balance')) {
          appError = createError(ErrorType.INSUFFICIENT_BALANCE, {
            required: amount,
            available: appKitBalance,
            symbol: 'STX'
          });
        } else if (error.message.includes('timeout')) {
          appError = createError(ErrorType.NETWORK_TIMEOUT);
        } else {
          appError = createError(ErrorType.CONTRACT_CALL_FAILED, {
            functionName: 'deposit',
            reason: error.message
          });
        }
      } else {
        appError = createError(ErrorType.UNKNOWN_ERROR, { originalError: String(error) });
      }
      
      setTransactionFailed(transaction.id, getErrorMessage(appError));
      setContractError(appError);
      showError('Deposit Failed', getErrorMessage(appError));
    }
  };

  // Withdraw STX from contract with comprehensive error handling
  // Validates user balance, initiates transaction flow, and handles all transaction states
  const withdraw = async (amount: number) => {
    // Check for AppKit wallet connection first
    if (!isAppKitConnected || !appKitAddress) {
      const error = createError(ErrorType.WALLET_NOT_CONNECTED);
      setContractError(error);
      showError('Wallet Not Connected', 'Please connect your wallet using AppKit to make withdrawals');
      return;
    }

    // Check if there's an AppKit connection error that requires reconnection
    if (appKitError && appKitRequiresReconnection()) {
      setContractError(appKitError);
      showError('Wallet Connection Issue', getAppKitErrorMessage() || 'Please reconnect your wallet');
      return;
    }

    // Pre-validate user has sufficient balance to prevent unnecessary contract calls
    // Use contract state userBalance for withdrawal validation (not wallet balance)
    if (contractState.userBalance < amount) {
      const error = createError(ErrorType.INSUFFICIENT_BALANCE, {
        required: amount,
        available: contractState.userBalance,
        symbol: 'STX'
      });
      setContractError(error);
      showError('Insufficient Balance', getErrorMessage(error));
      return;
    }

    // Initialize transaction flow for tracking and user feedback
    const transaction = startTransaction('withdraw', amount);
    showInfo('Withdrawal Initiated', `Preparing to withdraw ${amount.toFixed(6)} STX`);

    try {
      // Convert STX to microSTX for contract compatibility
      const microAmount = stxToMicroSTX(amount);

      const network = getStacksNetwork('mainnet');
      const transactionOptions = {
        contractAddress,
        contractName: CONTRACT_NAME,
        functionName: 'withdraw',
        functionArgs: [uintCV(microAmount)],
        network,
        appDetails: {
          name: 'Bitcoin Savings DApp',
          icon: window.location.origin + '/favicon.ico',
        },
      };

      // Use AppKit signTransaction if available
      if (appKitSignTransaction) {
        const result = await appKitSignTransaction(transactionOptions);
        if (result && appKitHandleTransactionResponse(result)) {
          const payload = result as any;
          // Update transaction state to broadcasting for UI feedback
          setTransactionBroadcasting(transaction.id, payload.txId);
          showSuccess('Withdrawal Broadcasted', `Transaction ${payload.txId.slice(0, 10)}... has been broadcasted`, {
            label: 'View in Explorer',
            onClick: () => window.open(`https://explorer.stacks.co/txid/${payload.txId}?chain=mainnet`, '_blank')
          });
        } else {
          // Handle failed transaction response
          setTransactionFailed(transaction.id, getAppKitErrorMessage() || 'Transaction failed');
          showError('Withdrawal Failed', getAppKitErrorMessage() || 'Transaction failed');
        }
      } else {
        // Fallback to openContractCall
        await openContractCall({
          ...transactionOptions,
          onFinish: (payload) => {
            if (payload.txId) {
              // Update transaction state to broadcasting for UI feedback
              setTransactionBroadcasting(transaction.id, payload.txId);
              showSuccess('Withdrawal Broadcasted', `Transaction ${payload.txId.slice(0, 10)}... has been broadcasted`, {
                label: 'View in Explorer',
                onClick: () => window.open(`https://explorer.stacks.co/txid/${payload.txId}?chain=mainnet`, '_blank')
              });
            }
          },
          onCancel: () => {
            // Handle user cancellation gracefully
            const error = createError(ErrorType.TRANSACTION_CANCELLED, { action: 'withdrawal' });
            setTransactionFailed(transaction.id, getErrorMessage(error));
            setContractError(error);
            showWarning('Withdrawal Cancelled', getErrorMessage(error));
          },
        });
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
      
      // Categorize errors for appropriate user feedback
      let appError: AppError;
      if (error instanceof AppError) {
        appError = error;
      } else if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          appError = createError(ErrorType.USER_REJECTED);
        } else if (error.message.includes('insufficient balance')) {
          appError = createError(ErrorType.INSUFFICIENT_BALANCE, {
            required: amount,
            available: contractState.userBalance,
            symbol: 'STX'
          });
        } else if (error.message.includes('timeout')) {
          appError = createError(ErrorType.NETWORK_TIMEOUT);
        } else {
          appError = createError(ErrorType.CONTRACT_CALL_FAILED, {
            functionName: 'withdraw',
            reason: error.message
          });
        }
      } else {
        appError = createError(ErrorType.UNKNOWN_ERROR, { originalError: String(error) });
      }
      
      setTransactionFailed(transaction.id, getErrorMessage(appError));
      setContractError(appError);
      showError('Withdrawal Failed', getErrorMessage(appError));
    }
  };

  // Create a new savings plan with comprehensive error handling
  const createSavingsPlan = async (targetAmount: number, deadline: number) => {
    // Check for AppKit wallet connection first
    if (!isAppKitConnected || !appKitAddress) {
      const error = createError(ErrorType.WALLET_NOT_CONNECTED);
      setContractError(error);
      showError('Wallet Not Connected', 'Please connect your wallet using AppKit to create a savings plan');
      return;
    }

    // Check if there's an AppKit connection error that requires reconnection
    if (appKitError && appKitRequiresReconnection()) {
      setContractError(appKitError);
      showError('Wallet Connection Issue', getAppKitErrorMessage() || 'Please reconnect your wallet');
      return;
    }

    // Start transaction flow
    const transaction = startTransaction('create-plan', targetAmount);
    showInfo('Savings Plan Creation', `Creating savings plan with target of ${targetAmount.toFixed(6)} STX`);

    try {
      const microTargetAmount = stxToMicroSTX(targetAmount);

      const network = getStacksNetwork('mainnet');
      const transactionOptions = {
        contractAddress,
        contractName: CONTRACT_NAME,
        functionName: 'create-savings-plan',
        functionArgs: [uintCV(microTargetAmount), uintCV(deadline)],
        network,
        appDetails: {
          name: 'Bitcoin Savings DApp',
          icon: window.location.origin + '/favicon.ico',
        },
      };

      // Use AppKit signTransaction if available
      if (appKitSignTransaction) {
        const result = await appKitSignTransaction(transactionOptions);
        if (result && appKitHandleTransactionResponse(result)) {
          const payload = result as any;
          setTransactionBroadcasting(transaction.id, payload.txId);
          showSuccess('Savings Plan Created', `Your savings plan has been created and broadcasted`, {
            label: 'View in Explorer',
            onClick: () => window.open(`https://explorer.stacks.co/txid/${payload.txId}?chain=mainnet`, '_blank')
          });
        } else {
          // Handle failed transaction response
          setTransactionFailed(transaction.id, getAppKitErrorMessage() || 'Transaction failed');
          showError('Failed to Create Plan', getAppKitErrorMessage() || 'Transaction failed');
        }
      } else {
        // Fallback to openContractCall
        await openContractCall({
          ...transactionOptions,
          onFinish: (payload) => {
            if (payload.txId) {
              setTransactionBroadcasting(transaction.id, payload.txId);
              showSuccess('Savings Plan Created', `Your savings plan has been created and broadcasted`, {
                label: 'View in Explorer',
                onClick: () => window.open(`https://explorer.stacks.co/txid/${payload.txId}?chain=mainnet`, '_blank')
              });
            }
          },
          onCancel: () => {
            const error = createError(ErrorType.TRANSACTION_CANCELLED, { action: 'savings plan creation' });
            setTransactionFailed(transaction.id, getErrorMessage(error));
            setContractError(error);
            showWarning('Plan Creation Cancelled', getErrorMessage(error));
          },
        });
      }
    } catch (error) {
      console.error('Create savings plan error:', error);
      
      let appError: AppError;
      if (error instanceof AppError) {
        appError = error;
      } else if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          appError = createError(ErrorType.USER_REJECTED);
        } else if (error.message.includes('timeout')) {
          appError = createError(ErrorType.NETWORK_TIMEOUT);
        } else {
          appError = createError(ErrorType.CONTRACT_CALL_FAILED, {
            functionName: 'create-savings-plan',
            reason: error.message
          });
        }
      } else {
        appError = createError(ErrorType.UNKNOWN_ERROR, { originalError: String(error) });
      }
      
      setTransactionFailed(transaction.id, getErrorMessage(appError));
      setContractError(appError);
      showError('Failed to Create Plan', getErrorMessage(appError));
    }
  };

  // Update existing savings plan
  const updateSavingsPlan = async (targetAmount: number, frequency: FrequencyType) => {
    // Check for AppKit wallet connection first
    if (!isAppKitConnected || !appKitAddress) {
      setTransactionStatus({
        loading: false,
        error: 'Wallet not connected',
        success: false,
      });
      showError('Wallet Not Connected', 'Please connect your wallet using AppKit to update your savings plan');
      return;
    }

    // Check if there's an AppKit connection error that requires reconnection
    if (appKitError && appKitRequiresReconnection()) {
      setContractError(appKitError);
      showError('Wallet Connection Issue', getAppKitErrorMessage() || 'Please reconnect your wallet');
      return;
    }

    setTransactionStatus({ loading: true, error: null, success: false });

    try {
      const microTargetAmount = stxToMicroSTX(targetAmount);
      const frequencyInBlocks = getFrequencyInBlocks(frequency);

      const network = getStacksNetwork('mainnet');
      const transactionOptions = {
        contractAddress,
        contractName: CONTRACT_NAME,
        functionName: 'update-savings-plan',
        functionArgs: [uintCV(microTargetAmount), uintCV(frequencyInBlocks)],
        network,
        appDetails: {
          name: 'Bitcoin Savings DApp',
          icon: window.location.origin + '/favicon.ico',
        },
      };

      // Use AppKit signTransaction if available
      if (appKitSignTransaction) {
        const result = await appKitSignTransaction(transactionOptions);
        if (result && appKitHandleTransactionResponse(result)) {
          setTransactionStatus({ loading: false, error: null, success: true });
          fetchContractState();
          fetchSavingsPlan();
        } else {
          setTransactionStatus({ loading: false, error: getAppKitErrorMessage() || 'Transaction failed', success: false });
          showError('Failed to Update Plan', getAppKitErrorMessage() || 'Transaction failed');
        }
      } else {
        // Fallback to openContractCall
        await openContractCall({
          ...transactionOptions,
          onFinish: () => {
            setTransactionStatus({ loading: false, error: null, success: true });
            fetchContractState();
            fetchSavingsPlan();
          },
          onCancel: () => {
            setTransactionStatus({ loading: false, error: 'Transaction cancelled', success: false });
          },
        });
      }
    } catch (error) {
      setTransactionStatus({
        loading: false,
        error: 'Failed to update savings plan',
        success: false,
      });
      console.error('Update savings plan error:', error);
    }
  };

  // Toggle auto-purchase for savings plan
  const toggleAutoPurchase = async () => {
    // Check for AppKit wallet connection first
    if (!isAppKitConnected || !appKitAddress) {
      setTransactionStatus({
        loading: false,
        error: 'Wallet not connected',
        success: false,
      });
      showError('Wallet Not Connected', 'Please connect your wallet using AppKit to toggle auto-purchase');
      return;
    }

    // Check if there's an AppKit connection error that requires reconnection
    if (appKitError && appKitRequiresReconnection()) {
      setContractError(appKitError);
      showError('Wallet Connection Issue', getAppKitErrorMessage() || 'Please reconnect your wallet');
      return;
    }

    setTransactionStatus({ loading: true, error: null, success: false });

    try {
      const network = getStacksNetwork('mainnet');
      const transactionOptions = {
        contractAddress,
        contractName: CONTRACT_NAME,
        functionName: 'toggle-auto-purchase',
        functionArgs: [],
        network,
        appDetails: {
          name: 'Bitcoin Savings DApp',
          icon: window.location.origin + '/favicon.ico',
        },
      };

      // Use AppKit signTransaction if available
      if (appKitSignTransaction) {
        const result = await appKitSignTransaction(transactionOptions);
        if (result && appKitHandleTransactionResponse(result)) {
          setTransactionStatus({ loading: false, error: null, success: true });
          fetchContractState();
          fetchSavingsPlan();
        } else {
          setTransactionStatus({ loading: false, error: getAppKitErrorMessage() || 'Transaction failed', success: false });
          showError('Failed to Toggle Auto-Purchase', getAppKitErrorMessage() || 'Transaction failed');
        }
      } else {
        // Fallback to openContractCall
        await openContractCall({
          ...transactionOptions,
          onFinish: () => {
            setTransactionStatus({ loading: false, error: null, success: true });
            fetchContractState();
            fetchSavingsPlan();
          },
          onCancel: () => {
            setTransactionStatus({ loading: false, error: 'Transaction cancelled', success: false });
          },
        });
      }
    } catch (error) {
      setTransactionStatus({
        loading: false,
        error: 'Failed to toggle auto-purchase',
        success: false,
      });
      console.error('Toggle auto-purchase error:', error);
    }
  };

  // Execute auto-purchase manually
  const executeAutoPurchase = async () => {
    // Check for AppKit wallet connection first
    if (!isAppKitConnected || !appKitAddress) {
      setTransactionStatus({
        loading: false,
        error: 'Wallet not connected',
        success: false,
      });
      showError('Wallet Not Connected', 'Please connect your wallet using AppKit to execute auto-purchase');
      return;
    }

    // Check if there's an AppKit connection error that requires reconnection
    if (appKitError && appKitRequiresReconnection()) {
      setContractError(appKitError);
      showError('Wallet Connection Issue', getAppKitErrorMessage() || 'Please reconnect your wallet');
      return;
    }

    setTransactionStatus({ loading: true, error: null, success: false });

    try {
      const network = getStacksNetwork('mainnet');
      const transactionOptions = {
        contractAddress,
        contractName: CONTRACT_NAME,
        functionName: 'execute-auto-purchase',
        functionArgs: [],
        network,
        appDetails: {
          name: 'Bitcoin Savings DApp',
          icon: window.location.origin + '/favicon.ico',
        },
      };

      // Use AppKit signTransaction if available
      if (appKitSignTransaction) {
        const result = await appKitSignTransaction(transactionOptions);
        if (result && appKitHandleTransactionResponse(result)) {
          setTransactionStatus({ loading: false, error: null, success: true });
          fetchContractState();
          fetchSavingsPlan();
        } else {
          setTransactionStatus({ loading: false, error: getAppKitErrorMessage() || 'Transaction failed', success: false });
          showError('Failed to Execute Auto-Purchase', getAppKitErrorMessage() || 'Transaction failed');
        }
      } else {
        // Fallback to openContractCall
        await openContractCall({
          ...transactionOptions,
          onFinish: () => {
            setTransactionStatus({ loading: false, error: null, success: true });
            fetchContractState();
            fetchSavingsPlan();
          },
          onCancel: () => {
            setTransactionStatus({ loading: false, error: 'Transaction cancelled', success: false });
          },
        });
      }
    } catch (error) {
      setTransactionStatus({
        loading: false,
        error: 'Failed to execute auto-purchase',
        success: false,
      });
      console.error('Execute auto-purchase error:', error);
    }
  };

  // Fetch savings plan details
  const fetchSavingsPlan = useCallback(async () => {
    // Prioritize AppKit address if available
    const effectiveAddress = isAppKitConnected ? appKitAddress : userAddress;
    if (!effectiveAddress) return;

    try {
      // In a real implementation, you would fetch from the Stacks API
      // For now, we'll use mock data
      const mockSavingsPlan: SavingsPlan = {
        id: 'plan-123',
        amount: 0.1,
        tokenType: 'STX',
        frequency: 'Monthly',
        frequencyInBlocks: 4320, // 30 days * 144 blocks per day
        startDate: new Date(Date.now() - 86400000 * 7), // 7 days ago
        endDate: new Date(Date.now() + 86400000 * 30), // 30 days from now
        targetAmount: 3.0,
        isActive: true,
        createdAt: new Date(Date.now() - 86400000 * 7),
        nextPurchaseDate: new Date(Date.now() + 86400000 * 3), // 3 days from now
      };

      setSavingsPlan(mockSavingsPlan);
    } catch (error) {
      console.error('Failed to fetch savings plan:', error);
    }
  }, [isAppKitConnected, appKitAddress, userAddress]);

  // Helper function to convert frequency to blocks
  const getFrequencyInBlocks = (frequency: FrequencyType): number => {
    const blocksPerDay = 144; // Approximate blocks per day on Stacks
    switch (frequency) {
      case 'Daily':
        return blocksPerDay;
      case 'Weekly':
        return blocksPerDay * 7;
      case 'Biweekly':
        return blocksPerDay * 14;
      case 'Monthly':
        return blocksPerDay * 30;
      default:
        return blocksPerDay * 30;
    }
  };

  // Reset transaction status
  const resetTransactionStatus = () => {
    setTransactionStatus({
      loading: false,
      error: null,
      success: false,
    });
  };

  useEffect(() => {
    fetchContractState();
    fetchSavingsPlan();
  }, [fetchContractState, fetchSavingsPlan]);

  // Handle transaction confirmation
  useEffect(() => {
    if (transactionFlow.currentTransaction?.state === 'confirmed') {
      const transaction = transactionFlow.currentTransaction;
      showSuccess('Transaction Confirmed', `${transaction.type} transaction has been confirmed`);
      fetchContractState();
      fetchSavingsPlan();
    }
  }, [transactionFlow.currentTransaction?.state, showSuccess, fetchContractState, fetchSavingsPlan]);

  // Handle transaction retry with better error handling
  // Reconstructs the original transaction with same parameters for retry
  const handleRetryTransaction = async (transactionId: string) => {
    const transaction = transactionFlow.currentTransaction;
    if (!transaction || transaction.id !== transactionId) return;

    let retryFunction: () => Promise<string | void>;
    
    // Reconstruct the retry function based on transaction type
    switch (transaction.type) {
      case 'deposit':
        if (transaction.amount) {
          retryFunction = async () => {
            const microAmount = stxToMicroSTX(transaction.amount!);
            const network = getStacksNetwork('mainnet');
            const transactionOptions = {
              contractAddress,
              contractName: CONTRACT_NAME,
              functionName: 'deposit',
              functionArgs: [uintCV(microAmount)],
              network,
              appDetails: {
                name: 'Bitcoin Savings DApp',
                icon: window.location.origin + '/favicon.ico',
              },
            };
            
            // Use AppKit signTransaction if available
            if (appKitSignTransaction) {
              const result = await appKitSignTransaction(transactionOptions);
              return (result as any)?.txId || undefined;
            } else {
              // Fallback to openContractCall
              return new Promise((resolve, reject) => {
                openContractCall({
                  ...transactionOptions,
                  onFinish: (payload) => resolve(payload.txId),
                  onCancel: () => reject(createError(ErrorType.TRANSACTION_CANCELLED, { action: 'deposit retry' })),
                });
              });
            }
          };
        } else {
          return;
        }
        break;
      case 'withdraw':
        if (transaction.amount) {
          retryFunction = async () => {
            const microAmount = stxToMicroSTX(transaction.amount!);
            const network = getStacksNetwork('mainnet');
            const transactionOptions = {
              contractAddress,
              contractName: CONTRACT_NAME,
              functionName: 'withdraw',
              functionArgs: [uintCV(microAmount)],
              network,
              appDetails: {
                name: 'Bitcoin Savings DApp',
                icon: window.location.origin + '/favicon.ico',
              },
            };
            
            // Use AppKit signTransaction if available
            if (appKitSignTransaction) {
              const result = await appKitSignTransaction(transactionOptions);
              return (result as any)?.txId || undefined;
            } else {
              // Fallback to openContractCall
              return new Promise((resolve, reject) => {
                openContractCall({
                  ...transactionOptions,
                  onFinish: (payload) => resolve(payload.txId),
                  onCancel: () => reject(createError(ErrorType.TRANSACTION_CANCELLED, { action: 'withdrawal retry' })),
                });
              });
            }
          };
        } else {
          return;
        }
        break;
      default:
        // Handle unsupported transaction types for retry
        const error = createError(ErrorType.UNKNOWN_ERROR, { reason: 'Retry is not supported for this transaction type' });
        setContractError(error);
        showWarning('Retry Not Supported', getErrorMessage(error));
        return;
    }

    // Show retry attempt count to user for transparency
    showInfo('Retrying Transaction', `Attempting retry ${((transaction.retryCount || 0) + 1)}/3`);
    await retryTransaction(transactionId, retryFunction);
  };

  return {
    contractState,
    transactionStatus,
    transactionHistory,
    savingsPlan,
    transactionFlow,
    contractError,
    deposit,
    withdraw,
    createSavingsPlan,
    updateSavingsPlan,
    toggleAutoPurchase,
    executeAutoPurchase,
    resetTransactionStatus,
    refreshState: fetchContractState,
    refreshSavingsPlan: fetchSavingsPlan,
    getFrequencyInBlocks,
    retryTransaction: handleRetryTransaction,
    clearCurrentTransaction,
    clearContractError: () => setContractError(null),
    getContractErrorMessage: () => contractError ? getErrorMessage(contractError) : null,
    isRetryableError: () => contractError ? isRetryableError(contractError) : false,
    requiresReconnection: () => contractError ? requiresReconnection(contractError) : false,
  };
}
