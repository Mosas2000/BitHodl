import { useState, useEffect, useCallback } from 'react';
import { useAppKit, useAppKitAccount, useAppKitProvider, useDisconnect } from '@/config/stacksAppkit';
import { StacksUser } from '@/types';
import { getNetworkConfig, microSTXToSTX } from '@/utils/stacks';
import {
  AppError,
  ErrorType,
  createError,
  getErrorMessage,
  isRetryableError,
  requiresReconnection
} from '@/utils/errors';

export function useAppKitWallet() {
  const [user, setUser] = useState<StacksUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  const [connectionState, setConnectionState] = useState<'idle' | 'connecting' | 'connected' | 'disconnected' | 'error'>('idle');
  const [currentNetwork] = useState<'mainnet' | 'testnet'>('mainnet');

  // AppKit hooks
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider('bip122' as any);
  const { disconnect } = useDisconnect();

  // Fetch user balance with retry logic and better error handling
  const fetchBalance = useCallback(async (address: string, retryCount = 0) => {
    if (!address) return;
    
    setIsBalanceLoading(true);
    try {
      const networkConfig = getNetworkConfig(currentNetwork);
      
      // Add timeout to the fetch request to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(
        `${networkConfig.coreApiUrl}/extended/v1/address/${address}/stx`,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        }
      );
      
      clearTimeout(timeoutId);
      
      // Categorize HTTP errors into appropriate application errors
      if (!response.ok) {
        if (response.status === 404) {
          throw createError(ErrorType.WALLET_NOT_CONNECTED);
        } else if (response.status >= 500) {
          throw createError(ErrorType.NETWORK_TIMEOUT, {
            statusCode: response.status,
            statusText: response.statusText
          });
        } else {
          throw createError(ErrorType.CONTRACT_CALL_FAILED, {
            functionName: 'fetch balance',
            reason: `Server returned ${response.status} ${response.statusText}`
          });
        }
      }
      
      const data = await response.json();
      const balanceInSTX = microSTXToSTX(parseFloat(data.balance || '0'));
      setBalance(balanceInSTX);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch balance:', err);
      setBalance(0);
      
      // Handle different error types with appropriate error creation
      if (err instanceof AppError) {
        setError(err);
      } else if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setError(createError(ErrorType.NETWORK_TIMEOUT));
        } else {
          setError(createError(ErrorType.UNKNOWN_ERROR, { originalError: err.message }));
        }
      } else {
        setError(createError(ErrorType.UNKNOWN_ERROR, { originalError: String(err) }));
      }
      
      // Implement exponential backoff retry for retryable errors
      // Max 3 retries with increasing delays (2s, 4s, 6s)
      if (retryCount < 2 && isRetryableError(err)) {
        setTimeout(() => fetchBalance(address, retryCount + 1), 2000 * (retryCount + 1));
      }
    } finally {
      setIsBalanceLoading(false);
    }
  }, [currentNetwork]);

  // Initialize wallet connection state
  useEffect(() => {
    const initializeWallet = async () => {
      setIsLoading(true);
      
      try {
        if (isConnected && address) {
          // Create user object from AppKit account
          const stacksUser: StacksUser = {
            address,
            profile: {
              stxAddress: address,
            },
          };
          
          setUser(stacksUser);
          setConnectionState('connected');
          fetchBalance(address);
        } else {
          setUser(null);
          setBalance(0);
          setConnectionState('disconnected');
        }
      } catch (err) {
        console.error('Failed to initialize wallet:', err);
        setError(createError(ErrorType.WALLET_NOT_CONNECTED, { originalError: err }));
        setConnectionState('error');
      }
      
      setIsLoading(false);
    };
    
    initializeWallet();
  }, [isConnected, address, fetchBalance]);

  // Connect wallet using AppKit
  const connectWallet = async () => {
    try {
      setError(null);
      setIsConnecting(true);
      setConnectionState('connecting');
      
      // Open AppKit modal for wallet connection
      open();
      
      // The actual connection state will be updated by useEffect hook above
      // when AppKit updates the isConnected state
    } catch (err) {
      console.error('Wallet connection error:', err);
      
      // Handle specific connection errors with appropriate error types
      if (err instanceof Error) {
        if (err.message.includes('No wallet')) {
          setError(createError(ErrorType.WALLET_NOT_INSTALLED));
        } else {
          setError(createError(ErrorType.WALLET_NOT_CONNECTED, { originalError: err }));
        }
      } else {
        setError(createError(ErrorType.UNKNOWN_ERROR, { originalError: err }));
      }
      
      setConnectionState('error');
      setIsConnecting(false);
    }
  };

  // Disconnect wallet using AppKit
  const disconnectWallet = async () => {
    try {
      await disconnect();
      setUser(null);
      setBalance(0);
      setError(null);
      setConnectionState('disconnected');
    } catch (err) {
      console.error('Wallet disconnection error:', err);
      setError(createError(ErrorType.UNKNOWN_ERROR, {
        originalError: err,
        context: 'wallet disconnection'
      }));
      setConnectionState('error');
    }
  };

  // Sign and broadcast transaction through AppKit
  const signTransaction = async (transactionOptions: any) => {
    if (!isConnected || !address) {
      setError(createError(ErrorType.WALLET_NOT_CONNECTED));
      return null;
    }

    try {
      // For now, we'll use the existing Stacks Connect approach
      // In a full implementation, this would integrate with AppKit's transaction signing
      // This is a placeholder that will be enhanced when AppKit fully supports Stacks transactions
      const { openContractCall } = await import('@stacks/connect');
      
      return new Promise((resolve, reject) => {
        openContractCall({
          ...transactionOptions,
          onFinish: (payload: any) => {
            // Refresh balance after successful transaction
            fetchBalance(address);
            setError(null);
            resolve(payload);
          },
          onCancel: () => {
            const error = createError(ErrorType.TRANSACTION_CANCELLED, { action: 'contract call' });
            setError(error);
            reject(error);
          },
        });
      });
    } catch (err) {
      console.error('Transaction signing error:', err);
      
      // Categorize transaction errors for better user feedback
      if (err instanceof Error) {
        if (err.message.includes('User rejected')) {
          setError(createError(ErrorType.USER_REJECTED));
        } else if (err.message.includes('insufficient balance')) {
          setError(createError(ErrorType.INSUFFICIENT_BALANCE, {
            required: transactionOptions.amount,
            available: balance,
            symbol: 'STX'
          }));
        } else if (err.message.includes('timeout')) {
          setError(createError(ErrorType.NETWORK_TIMEOUT));
        } else {
          setError(createError(ErrorType.TRANSACTION_FAILED, {
            reason: err.message,
            originalError: err
          }));
        }
      } else {
        setError(createError(ErrorType.UNKNOWN_ERROR, { originalError: err }));
      }
      
      return false;
    }
  };

  // Enhanced transaction status handling for AppKit responses
  const handleTransactionResponse = useCallback((response: any) => {
    if (!response) {
      setError(createError(ErrorType.TRANSACTION_FAILED, { reason: 'No response from wallet' }));
      return false;
    }

    // Handle different response formats from AppKit
    if (response.txId) {
      // Transaction was successfully broadcasted
      setError(null);
      return true;
    } else if (response.error) {
      // Handle specific error from AppKit
      const errorMessage = response.error.message || response.error;
      if (errorMessage.includes('User rejected') || errorMessage.includes('User denied')) {
        setError(createError(ErrorType.USER_REJECTED));
      } else if (errorMessage.includes('insufficient balance')) {
        setError(createError(ErrorType.INSUFFICIENT_BALANCE, {
          available: balance,
          symbol: 'STX'
        }));
      } else if (errorMessage.includes('timeout')) {
        setError(createError(ErrorType.NETWORK_TIMEOUT));
      } else {
        setError(createError(ErrorType.TRANSACTION_FAILED, { reason: errorMessage }));
      }
      return false;
    }

    // Default to success if no error detected
    setError(null);
    return true;
  }, [balance]);

  // Refresh balance with error handling
  const refreshBalance = useCallback(() => {
    if (address) {
      setError(null);
      fetchBalance(address);
    }
  }, [address, fetchBalance]);

  // Clear error manually
  const clearError = useCallback(() => {
    setError(null);
    if (connectionState === 'error') {
      setConnectionState(isConnected ? 'connected' : 'disconnected');
    }
  }, [connectionState, isConnected]);

  return {
    user,
    isLoading,
    isConnecting,
    error,
    balance,
    isBalanceLoading,
    connectionState,
    currentNetwork,
    isConnected,
    address,
    walletProvider,
    connectWallet,
    disconnectWallet,
    signTransaction,
    refreshBalance,
    clearError,
    isAuthenticated: !!user,
    getErrorMessage: () => error ? getErrorMessage(error) : null,
    isRetryableError: () => error ? isRetryableError(error) : false,
    requiresReconnection: () => error ? requiresReconnection(error) : false,
    handleTransactionResponse,
  };
}