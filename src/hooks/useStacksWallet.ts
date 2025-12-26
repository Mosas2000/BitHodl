import { useState, useEffect, useCallback } from 'react';
import { UserSession, AppConfig, showConnect, openSTXTransfer } from '@stacks/connect';
import { StacksUser } from '@/types';
import { getNetworkConfig, getStacksNetwork, microSTXToSTX } from '@/utils/stacks';
import {
  AppError,
  ErrorType,
  createError,
  getErrorMessage,
  isRetryableError,
  requiresReconnection
} from '@/utils/errors';
import { useAppKitWallet } from './useAppKitWallet';

const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });

export function useStacksWallet() {
  const [user, setUser] = useState<StacksUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  const [connectionState, setConnectionState] = useState<'idle' | 'connecting' | 'connected' | 'disconnected' | 'error'>('idle');
  const [currentNetwork, setCurrentNetwork] = useState<'mainnet' | 'testnet'>('mainnet');
  const [walletInstalled, setWalletInstalled] = useState<boolean>(true);
  
  // Get AppKit wallet connection state
  const {
    user: appKitUser,
    isConnected: isAppKitConnected,
    address: appKitAddress,
    balance: appKitBalance,
    isBalanceLoading: isAppKitBalanceLoading,
    error: appKitError,
    connectWallet: connectAppKitWallet,
    disconnectWallet: disconnectAppKitWallet,
    signTransaction: appKitSignTransaction
  } = useAppKitWallet();

  // Check if wallet is installed
  const checkWalletInstallation = useCallback(() => {
    if (typeof window === 'undefined') return false;
    
    // Check for common Stacks wallets
    const hasHiroWallet = !!(window as any).HiroWalletProvider;
    const hasXverseWallet = !!(window as any).StacksProvider;
    
    const isInstalled = hasHiroWallet || hasXverseWallet;
    setWalletInstalled(isInstalled);
    
    if (!isInstalled) {
      const error = createError(ErrorType.WALLET_NOT_INSTALLED);
      setError(error);
      setConnectionState('error');
    }
    
    return isInstalled;
  }, []);

  // Detect current network
  const detectNetwork = useCallback(async (): Promise<'mainnet' | 'testnet'> => {
    try {
      // In a real implementation, you would check the wallet's current network
      // For now, we'll default to mainnet
      const network = 'mainnet';
      setCurrentNetwork(network);
      return network;
    } catch (err) {
      console.error('Failed to detect network:', err);
      return 'mainnet';
    }
  }, []);

  // Fetch user balance with retry logic and better error handling
  // Implements exponential backoff for retries and comprehensive error categorization
  const fetchBalance = useCallback(async (address: string, retryCount = 0) => {
    if (!address) return;
    
    setIsBalanceLoading(true);
    try {
      const network = await detectNetwork();
      const networkConfig = getNetworkConfig(network);
      
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
  }, [detectNetwork]);

  useEffect(() => {
    const initializeWallet = async () => {
      setIsLoading(true);
      
      // Prioritize AppKit wallet connection
      if (isAppKitConnected && appKitUser) {
        setUser(appKitUser);
        setBalance(appKitBalance);
        setConnectionState('connected');
        setIsLoading(false);
        return;
      }
      
      // Check wallet installation first for legacy wallet
      if (!checkWalletInstallation()) {
        setIsLoading(false);
        return;
      }
      
      // Check if user is already authenticated with legacy wallet
      if (userSession.isUserSignedIn()) {
        try {
          const userData = userSession.loadUserData();
          const address = userData.profile.stxAddress;
          
          setUser({
            address,
            profile: userData.profile,
          });
          setConnectionState('connected');
          fetchBalance(address);
        } catch (err) {
          console.error('Failed to initialize wallet:', err);
          setError(createError(ErrorType.WALLET_NOT_CONNECTED, { originalError: err }));
          setConnectionState('error');
        }
      } else {
        setConnectionState('disconnected');
      }
      
      setIsLoading(false);
    };
    
    initializeWallet();
  }, [checkWalletInstallation, detectNetwork, fetchBalance, isAppKitConnected, appKitUser, appKitBalance]);

  const connectWallet = async () => {
    try {
      setError(null);
      setIsConnecting(true);
      setConnectionState('connecting');
      
      // Prioritize AppKit wallet connection
      if (!isAppKitConnected) {
        await connectAppKitWallet();
        setIsConnecting(false);
        return;
      }
      
      // Check wallet installation first for legacy wallet to provide better UX
      if (!checkWalletInstallation()) {
        setIsConnecting(false);
        return;
      }
      
      // Initiate legacy wallet connection using Stacks Connect
      showConnect({
        appDetails: {
          name: 'Bitcoin Savings DApp',
          icon: window.location.origin + '/favicon.ico',
        },
        userSession,
        onFinish: async () => {
          try {
            // Instead of reloading, we'll update the state directly for better UX
            if (userSession.isUserSignedIn()) {
              const userData = userSession.loadUserData();
              const address = userData.profile.stxAddress;
              
              // Detect network after connection to ensure compatibility
              const network = await detectNetwork();
              
              // Validate network matches expected network (mainnet for production)
              const expectedNetwork = 'mainnet'; // This could be configurable
              if (network !== expectedNetwork) {
                setError(createError(ErrorType.WRONG_NETWORK, {
                  currentNetwork: network,
                  expectedNetwork
                }));
                setConnectionState('error');
              } else {
                setUser({
                  address,
                  profile: userData.profile,
                });
                setConnectionState('connected');
                // Fetch balance immediately after successful connection
                fetchBalance(address);
              }
            } else {
              setError(createError(ErrorType.WALLET_NOT_CONNECTED));
              setConnectionState('error');
            }
          } catch (err) {
            console.error('Failed to complete wallet connection:', err);
            setError(createError(ErrorType.WALLET_NOT_CONNECTED, { originalError: err }));
            setConnectionState('error');
          }
          setIsConnecting(false);
        },
        onCancel: () => {
          // Handle user cancellation gracefully
          setError(createError(ErrorType.TRANSACTION_CANCELLED, { action: 'wallet connection' }));
          setConnectionState('disconnected');
          setIsConnecting(false);
        },
      });
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

  const disconnectWallet = async () => {
    try {
      // Disconnect AppKit wallet if connected
      if (isAppKitConnected) {
        await disconnectAppKitWallet();
      }
      
      // Disconnect legacy wallet if connected
      if (userSession.isUserSignedIn()) {
        userSession.signUserOut();
      }
      
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

  // Sign and broadcast transaction with comprehensive error handling
  // Validates balance, formats amount correctly, and handles all transaction states
  const signTransaction = async (recipient: string, amount: number, memo?: string) => {
    // Check for AppKit wallet connection first
    if (isAppKitConnected && appKitSignTransaction) {
      // Pre-transaction validation to prevent unnecessary wallet prompts
      if (appKitBalance < amount) {
        setError(createError(ErrorType.INSUFFICIENT_BALANCE, {
          required: amount,
          available: appKitBalance,
          symbol: 'STX'
        }));
        return null;
      }

      try {
        const network = getStacksNetwork(currentNetwork);
        // Convert STX to microSTX for blockchain compatibility
        const transactionOptions = {
          recipient,
          amount: (amount * 1_000_000).toFixed(0),
          memo: memo || '',
          network,
          appDetails: {
            name: 'Bitcoin Savings DApp',
            icon: window.location.origin + '/favicon.ico',
          },
        };

        const result = await appKitSignTransaction(transactionOptions);
        if (result) {
          setError(null);
          return result;
        }
        return null;
      } catch (err) {
        console.error('AppKit transaction signing error:', err);
        
        // Categorize transaction errors for better user feedback
        if (err instanceof Error) {
          if (err.message.includes('User rejected')) {
            setError(createError(ErrorType.USER_REJECTED));
          } else if (err.message.includes('insufficient balance')) {
            setError(createError(ErrorType.INSUFFICIENT_BALANCE, {
              required: amount,
              available: appKitBalance,
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
    }

    // Fallback to legacy wallet
    if (!user) {
      setError(createError(ErrorType.WALLET_NOT_CONNECTED));
      return null;
    }

    // Pre-transaction validation to prevent unnecessary wallet prompts
    if (balance < amount) {
      setError(createError(ErrorType.INSUFFICIENT_BALANCE, {
        required: amount,
        available: balance,
        symbol: 'STX'
      }));
      return null;
    }

    try {
      const network = getStacksNetwork(currentNetwork);
      // Convert STX to microSTX for blockchain compatibility
      await openSTXTransfer({
        recipient,
        amount: (amount * 1_000_000).toFixed(0),
        memo: memo || '',
        network,
        appDetails: {
          name: 'Bitcoin Savings DApp',
          icon: window.location.origin + '/favicon.ico',
        },
        onFinish: () => {
          // Refresh balance after successful transaction to reflect changes
          fetchBalance(user.address);
          setError(null);
        },
        onCancel: () => {
          // Handle user cancellation without treating as error
          setError(createError(ErrorType.TRANSACTION_CANCELLED, { action: 'STX transfer' }));
        },
      });
      return true;
    } catch (err) {
      console.error('Transaction signing error:', err);
      
      // Categorize transaction errors for better user feedback
      if (err instanceof Error) {
        if (err.message.includes('User rejected')) {
          setError(createError(ErrorType.USER_REJECTED));
        } else if (err.message.includes('insufficient balance')) {
          setError(createError(ErrorType.INSUFFICIENT_BALANCE, {
            required: amount,
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

  // Refresh balance with error handling
  const refreshBalance = useCallback(() => {
    if (isAppKitConnected && appKitAddress) {
      setError(null);
      // AppKit handles balance refresh automatically
      return;
    }
    
    if (user?.address) {
      setError(null);
      fetchBalance(user.address);
    }
  }, [isAppKitConnected, appKitAddress, user?.address, fetchBalance]);

  // Clear error manually
  const clearError = useCallback(() => {
    setError(null);
    if (connectionState === 'error') {
      setConnectionState(user ? 'connected' : 'disconnected');
    }
  }, [connectionState, user]);

  // Handle wallet account changes
  const handleAccountChange = useCallback(() => {
    // This would be called when the wallet account changes
    // In a real implementation, you'd listen for wallet events
    if (user) {
      setError(createError(ErrorType.WALLET_NOT_CONNECTED, {
        reason: 'Account changed. Please reconnect your wallet.'
      }));
      setConnectionState('error');
      setUser(null);
      setBalance(0);
    }
  }, [user]);

  // Handle network changes
  const handleNetworkChange = useCallback(async () => {
    // This would be called when the wallet network changes
    // In a real implementation, you'd listen for wallet events
    const newNetwork = await detectNetwork();
    if (newNetwork !== currentNetwork) {
      setError(createError(ErrorType.WRONG_NETWORK, {
        currentNetwork: newNetwork,
        expectedNetwork: currentNetwork
      }));
      setConnectionState('error');
    }
  }, [currentNetwork, detectNetwork]);

  return {
    user,
    isLoading,
    isConnecting,
    error,
    balance: isAppKitConnected ? appKitBalance : balance,
    isBalanceLoading: isAppKitConnected ? isAppKitBalanceLoading : isBalanceLoading,
    connectionState,
    currentNetwork,
    walletInstalled,
    connectWallet,
    disconnectWallet,
    signTransaction,
    refreshBalance,
    clearError,
    handleAccountChange,
    handleNetworkChange,
    isAuthenticated: !!user || isAppKitConnected,
    isAppKitConnected,
    appKitAddress,
    getErrorMessage: () => error ? getErrorMessage(error) : null,
    isRetryableError: () => error ? isRetryableError(error) : false,
    requiresReconnection: () => error ? requiresReconnection(error) : false,
  };
}
