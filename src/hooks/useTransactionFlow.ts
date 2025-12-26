import { useState, useCallback, useEffect, useRef } from 'react';
import { TransactionDetails, TransactionFlowState } from '@/types';
import { getNetworkConfig } from '@/utils/stacks';
import {
  AppError,
  ErrorType,
  createError,
  getErrorMessage,
  isRetryableError
} from '@/utils/errors';
import { useAppKitWallet } from './useAppKitWallet';

interface UseTransactionFlowOptions {
  maxRetries?: number;
  retryDelay?: number;
  confirmationCheckInterval?: number;
}

export function useTransactionFlow(options: UseTransactionFlowOptions = {}) {
  const {
    maxRetries = 3,
    retryDelay = 2000,
    confirmationCheckInterval = 5000,
  } = options;

  // Get AppKit wallet connection state for better error handling
  const {
    isConnected: isAppKitConnected,
    error: appKitError,
    getErrorMessage: getAppKitErrorMessage,
    requiresReconnection: appKitRequiresReconnection
  } = useAppKitWallet();

  const [transactionFlow, setTransactionFlow] = useState<TransactionFlowState>({
    currentTransaction: null,
    queue: [],
    history: [],
  });

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [monitoringError, setMonitoringError] = useState<AppError | null>(null);
  const monitoringIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const monitoringTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generate explorer URL for transaction
  const getExplorerUrl = useCallback((txId: string): string => {
    const networkConfig = getNetworkConfig('mainnet'); // Default to mainnet
    return `${networkConfig.coreApiUrl.replace('/extended/v1', '')}/txid/${txId}`;
  }, []);

  // Start a new transaction
  const startTransaction = useCallback((
    type: TransactionDetails['type'],
    amount?: number
  ): TransactionDetails => {
    const newTransaction: TransactionDetails = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      amount,
      state: 'pending',
      timestamp: Date.now(),
      retryCount: 0,
    };

    setTransactionFlow((prev) => ({
      ...prev,
      currentTransaction: newTransaction,
    }));

    return newTransaction;
  }, []);

  // Update transaction state
  const updateTransactionState = useCallback((
    transactionId: string,
    updates: Partial<TransactionDetails>
  ) => {
    setTransactionFlow((prev) => {
      if (!prev.currentTransaction || prev.currentTransaction.id !== transactionId) {
        return prev;
      }

      const updatedTransaction = { ...prev.currentTransaction, ...updates };
      
      return {
        ...prev,
        currentTransaction: updatedTransaction,
      };
    });
  }, []);

  // Set transaction as broadcasting with txId
  const setTransactionBroadcasting = useCallback((
    transactionId: string,
    txId: string
  ) => {
    const explorerUrl = getExplorerUrl(txId);
    
    updateTransactionState(transactionId, {
      state: 'broadcasting',
      txId,
      explorerUrl,
    });
  }, [updateTransactionState, getExplorerUrl]);

  // Set transaction as confirmed
  const setTransactionConfirmed = useCallback((
    transactionId: string,
    confirmations?: number,
    blockHeight?: number
  ) => {
    updateTransactionState(transactionId, {
      state: 'confirmed',
      confirmations,
      blockHeight,
    });

    // Move to history after a delay
    setTimeout(() => {
      setTransactionFlow((prev) => {
        if (!prev.currentTransaction || prev.currentTransaction.id !== transactionId) {
          return prev;
        }

        return {
          ...prev,
          currentTransaction: null,
          history: [prev.currentTransaction, ...prev.history],
        };
      });
    }, 3000);
  }, [updateTransactionState]);

  // Set transaction as failed
  const setTransactionFailed = useCallback((
    transactionId: string,
    error: string
  ) => {
    updateTransactionState(transactionId, {
      state: 'failed',
      error,
    });
  }, [updateTransactionState]);

  // Retry a failed transaction with better error handling
  const retryTransaction = useCallback(async (
    transactionId: string,
    retryFunction: () => Promise<string | void>
  ) => {
    // Check for AppKit connection issues before retrying
    if (isAppKitConnected && appKitError && appKitRequiresReconnection()) {
      setTransactionFailed(transactionId, getAppKitErrorMessage() || 'Wallet connection issue. Please reconnect your wallet.');
      return;
    }

    setTransactionFlow((prev) => {
      if (!prev.currentTransaction || prev.currentTransaction.id !== transactionId) {
        return prev;
      }

      const retryCount = (prev.currentTransaction.retryCount || 0) + 1;
      
      if (retryCount > maxRetries) {
        const error = createError(ErrorType.TRANSACTION_FAILED, {
          reason: `Transaction failed after ${maxRetries} retries`,
          retryCount
        });
        return {
          ...prev,
          currentTransaction: {
            ...prev.currentTransaction,
            state: 'failed',
            error: getErrorMessage(error),
            retryCount,
          },
        };
      }

      return {
        ...prev,
        currentTransaction: {
          ...prev.currentTransaction,
          state: 'pending',
          error: undefined,
          retryCount,
        },
      };
    });

    // Wait before retrying with exponential backoff
    const backoffDelay = retryDelay * Math.pow(2, Math.min(transactionFlow.currentTransaction?.retryCount || 0, 3));
    await new Promise((resolve) => setTimeout(resolve, backoffDelay));

    try {
      const result = await retryFunction();
      if (typeof result === 'string') {
        setTransactionBroadcasting(transactionId, result);
      }
    } catch (error) {
      console.error('Retry failed:', error);
      
      let errorMessage: string;
      if (error instanceof AppError) {
        errorMessage = getErrorMessage(error);
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        errorMessage = 'Unknown error occurred during retry';
      }
      
      setTransactionFailed(transactionId, errorMessage);
    }
  }, [maxRetries, retryDelay, setTransactionBroadcasting, setTransactionFailed, transactionFlow.currentTransaction?.retryCount, isAppKitConnected, appKitError, appKitRequiresReconnection, getAppKitErrorMessage]);

  // Monitor transaction confirmation with better error handling
  const startMonitoring = useCallback((transactionId: string, txId: string) => {
    if (isMonitoring) return;

    // Check for AppKit connection issues before starting monitoring
    if (isAppKitConnected && appKitError && appKitRequiresReconnection()) {
      setTransactionFailed(transactionId, getAppKitErrorMessage() || 'Wallet connection issue. Please reconnect your wallet.');
      return;
    }

    setIsMonitoring(true);
    setMonitoringError(null);

    // Set a timeout to stop monitoring after a reasonable period
    monitoringTimeoutRef.current = setTimeout(() => {
      setTransactionFailed(transactionId, 'Transaction confirmation timed out. Please check the explorer for status.');
      stopMonitoring();
    }, 300000); // 5 minutes timeout

    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 3;

    monitoringIntervalRef.current = setInterval(async () => {
      try {
        const networkConfig = getNetworkConfig('mainnet');
        
        // Add timeout to the fetch request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        const response = await fetch(
          `${networkConfig.coreApiUrl}/extended/v1/tx/${txId}`,
          {
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
          }
        );
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status === 404) {
            // Transaction might not be indexed yet, continue monitoring
            consecutiveErrors = 0;
            return;
          } else if (response.status >= 500) {
            throw createError(ErrorType.NETWORK_TIMEOUT, {
              statusCode: response.status,
              statusText: response.statusText
            });
          } else {
            throw createError(ErrorType.CONTRACT_CALL_FAILED, {
              functionName: 'monitor transaction',
              reason: `Server returned ${response.status} ${response.statusText}`
            });
          }
        }

        const data = await response.json();
        consecutiveErrors = 0; // Reset error count on successful request

        if (data.tx_status === 'success') {
          setTransactionConfirmed(transactionId, data.confirmations, data.block_height);
          stopMonitoring();
        } else if (data.tx_status === 'failed') {
          const reason = data.tx_result?.repr || 'Transaction failed on chain';
          setTransactionFailed(transactionId, reason);
          stopMonitoring();
        }
        // If status is 'pending', continue monitoring
      } catch (error) {
        console.error('Error monitoring transaction:', error);
        consecutiveErrors++;
        
        // Handle different error types
        if (error instanceof AppError) {
          setMonitoringError(error);
        } else if (error instanceof Error) {
          if (error.name === 'AbortError') {
            setMonitoringError(createError(ErrorType.NETWORK_TIMEOUT));
          } else {
            setMonitoringError(createError(ErrorType.UNKNOWN_ERROR, { originalError: error.message }));
          }
        } else {
          setMonitoringError(createError(ErrorType.UNKNOWN_ERROR, { originalError: String(error) }));
        }
        
        // Stop monitoring if too many consecutive errors
        if (consecutiveErrors >= maxConsecutiveErrors) {
          setTransactionFailed(
            transactionId,
            `Failed to monitor transaction after ${maxConsecutiveErrors} attempts. Please check the explorer for status.`
          );
          stopMonitoring();
        }
      }
    }, confirmationCheckInterval);
  }, [isMonitoring, confirmationCheckInterval, setTransactionConfirmed, setTransactionFailed, isAppKitConnected, appKitError, appKitRequiresReconnection, getAppKitErrorMessage]);

  // Stop monitoring with cleanup
  const stopMonitoring = useCallback(() => {
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
    }
    if (monitoringTimeoutRef.current) {
      clearTimeout(monitoringTimeoutRef.current);
      monitoringTimeoutRef.current = null;
    }
    setIsMonitoring(false);
    setMonitoringError(null);
  }, []);

  // Clear current transaction
  const clearCurrentTransaction = useCallback(() => {
    stopMonitoring();
    setTransactionFlow((prev) => {
      if (!prev.currentTransaction) return prev;

      return {
        ...prev,
        currentTransaction: null,
        history: [prev.currentTransaction, ...prev.history],
      };
    });
  }, [stopMonitoring]);

  // Reset entire flow
  const resetTransactionFlow = useCallback(() => {
    stopMonitoring();
    setTransactionFlow({
      currentTransaction: null,
      queue: [],
      history: [],
    });
  }, [stopMonitoring]);

  // Auto-start monitoring when transaction is broadcasting
  useEffect(() => {
    if (transactionFlow.currentTransaction?.state === 'broadcasting' && 
        transactionFlow.currentTransaction.txId) {
      startMonitoring(
        transactionFlow.currentTransaction.id,
        transactionFlow.currentTransaction.txId
      );
    }
  }, [transactionFlow.currentTransaction, startMonitoring]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current);
      }
    };
  }, []);

  return {
    transactionFlow,
    startTransaction,
    updateTransactionState,
    setTransactionBroadcasting,
    setTransactionConfirmed,
    setTransactionFailed,
    retryTransaction,
    clearCurrentTransaction,
    resetTransactionFlow,
    isMonitoring,
    monitoringError,
    getMonitoringErrorMessage: () => monitoringError ? getErrorMessage(monitoringError) : null,
    isRetryableError: (error: unknown) => isRetryableError(error),
    isAppKitConnected,
    appKitError,
    getAppKitErrorMessage,
    appKitRequiresReconnection,
  };
}