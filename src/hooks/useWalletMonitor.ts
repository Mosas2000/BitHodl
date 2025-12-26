import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  WalletState, 
  WalletEvent, 
  walletMonitor, 
  monitorWalletDuringTransaction,
  createWalletMonitorHook 
} from '@/utils/walletMonitor';
import { ErrorType, createError, getErrorMessage } from '@/utils/errors';

export interface UseWalletMonitorOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  monitorTransactions?: boolean;
}

export function useWalletMonitor(options: UseWalletMonitorOptions = {}) {
  const {
    autoRefresh = true,
    refreshInterval = 5000,
    monitorTransactions = true,
  } = options;

  const [walletState, setWalletState] = useState<WalletState>(walletMonitor.getState());
  const [lastEvent, setLastEvent] = useState<WalletEvent | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const monitorRef = useRef(createWalletMonitorHook());

  // Update wallet state
  const updateWalletState = useCallback(() => {
    const newState = monitorRef.current.getState();
    setWalletState(newState);
    return newState;
  }, []);

  // Handle wallet events
  const handleWalletEvent = useCallback((event: WalletEvent) => {
    setLastEvent(event);
    updateWalletState();
    
    // Log events for debugging
    console.log('Wallet event:', event);
  }, [updateWalletState]);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;
    
    setIsMonitoring(true);
    const unsubscribe = monitorRef.current.subscribe(handleWalletEvent);
    
    // Initial state update
    updateWalletState();
    
    return unsubscribe;
  }, [isMonitoring, handleWalletEvent, updateWalletState]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    // Note: We don't actually stop the underlying monitor as it might be used by other components
  }, []);

  // Refresh wallet state
  const refreshWalletState = useCallback(async () => {
    try {
      await monitorRef.current.refreshState();
      return updateWalletState();
    } catch (error) {
      console.error('Failed to refresh wallet state:', error);
      return walletState;
    }
  }, [updateWalletState, walletState]);

  // Check if wallet is installed
  const isWalletInstalled = useCallback(() => {
    return monitorRef.current.isWalletInstalled();
  }, []);

  // Check if wallet is connected
  const isWalletConnected = useCallback(() => {
    return monitorRef.current.isWalletConnected();
  }, []);

  // Get current account
  const getCurrentAccount = useCallback(() => {
    return monitorRef.current.getCurrentAccount();
  }, []);

  // Get current network
  const getCurrentNetwork = useCallback(() => {
    return monitorRef.current.getCurrentNetwork();
  }, []);

  // Check if wallet is locked
  const isWalletLocked = useCallback(async () => {
    try {
      return await monitorRef.current.isWalletLocked();
    } catch (error) {
      console.error('Failed to check wallet lock state:', error);
      return false;
    }
  }, []);

  // Get wallet info
  const getWalletInfo = useCallback(async () => {
    try {
      return await monitorRef.current.getWalletInfo();
    } catch (error) {
      console.error('Failed to get wallet info:', error);
      return null;
    }
  }, []);

  // Create wallet error with context
  const createWalletError = useCallback((errorType: ErrorType, details?: any) => {
    return monitorRef.current.createWalletError(errorType, details);
  }, []);

  // Monitor wallet during transaction
  const monitorTransaction = useCallback(<T>(
    transactionPromise: Promise<T>,
    options: {
      onDisconnect?: () => void;
      onAccountChange?: (newAccount: string) => void;
      onNetworkChange?: (newNetwork: string) => void;
    }
  ) => {
    if (!monitorTransactions) {
      return transactionPromise;
    }

    return monitorWalletDuringTransaction(transactionPromise, options);
  }, [monitorTransactions]);

  // Get user-friendly error message
  const getWalletErrorMessage = useCallback((error: unknown): string => {
    if (error instanceof Error) {
      // Check for common wallet error patterns
      const message = error.message.toLowerCase();
      
      if (message.includes('wallet not connected') || message.includes('not connected')) {
        return getErrorMessage(createError(ErrorType.WALLET_NOT_CONNECTED));
      } else if (message.includes('user rejected') || message.includes('user denied')) {
        return getErrorMessage(createError(ErrorType.USER_REJECTED));
      } else if (message.includes('wallet locked')) {
        return 'Your wallet is locked. Please unlock your wallet to continue.';
      } else if (message.includes('account changed')) {
        return 'Your wallet account changed. Please reconnect your wallet.';
      } else if (message.includes('network changed')) {
        return 'Your wallet network changed. Please switch to the correct network.';
      }
    }
    
    return getErrorMessage(error);
  }, []);

  // Check for wallet-specific errors
  const isWalletError = useCallback((error: unknown): boolean => {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return message.includes('wallet') || 
             message.includes('account') || 
             message.includes('network') ||
             message.includes('connect');
    }
    return false;
  }, []);

  // Initialize monitoring
  useEffect(() => {
    const unsubscribe = startMonitoring();
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [startMonitoring]);

  // Auto-refresh if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refreshWalletState();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refreshWalletState]);

  // Monitor for wallet disconnection
  useEffect(() => {
    if (!walletState.isConnected && lastEvent?.type === 'disconnected') {
      console.warn('Wallet disconnected unexpectedly');
      // Could trigger a toast notification here
    }
  }, [walletState.isConnected, lastEvent]);

  return {
    // State
    walletState,
    lastEvent,
    isMonitoring,
    
    // Computed properties
    isConnected: walletState.isConnected,
    isInstalled: walletState.isInstalled,
    currentAccount: walletState.currentAccount,
    currentNetwork: walletState.network,
    isLocked: walletState.isLocked,
    lastActivity: walletState.lastActivity,
    
    // Methods
    startMonitoring,
    stopMonitoring,
    refreshWalletState,
    isWalletInstalled,
    isWalletConnected,
    getCurrentAccount,
    getCurrentNetwork,
    isWalletLocked,
    getWalletInfo,
    createWalletError,
    monitorTransaction,
    
    // Error handling
    getWalletErrorMessage,
    isWalletError,
  };
}

// Hook for monitoring specific wallet events
export function useWalletEvent(eventType: WalletEvent['type'], callback: (event: WalletEvent) => void) {
  const [lastMatchingEvent, setLastMatchingEvent] = useState<WalletEvent | null>(null);
  const monitorRef = useRef(createWalletMonitorHook());

  useEffect(() => {
    const unsubscribe = monitorRef.current.subscribe((event) => {
      if (event.type === eventType) {
        setLastMatchingEvent(event);
        callback(event);
      }
    });

    return unsubscribe;
  }, [eventType, callback]);

  return lastMatchingEvent;
}

// Hook for monitoring wallet connection state
export function useWalletConnection() {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const monitorRef = useRef(createWalletMonitorHook());

  useEffect(() => {
    const unsubscribe = monitorRef.current.subscribe((event) => {
      switch (event.type) {
        case 'connected':
          setIsConnected(true);
          setAccount(event.data?.account || null);
          break;
        case 'disconnected':
          setIsConnected(false);
          setAccount(null);
          break;
        case 'accountChanged':
          setAccount(event.data?.account || null);
          break;
      }
    });

    // Initialize state
    const initialState = monitorRef.current.getState();
    setIsConnected(initialState.isConnected);
    setAccount(initialState.currentAccount);

    return unsubscribe;
  }, []);

  return {
    isConnected,
    account,
  };
}

// Hook for monitoring wallet network state
export function useWalletNetwork() {
  const [network, setNetwork] = useState<string | null>(null);
  const monitorRef = useRef(createWalletMonitorHook());

  useEffect(() => {
    const unsubscribe = monitorRef.current.subscribe((event) => {
      if (event.type === 'networkChanged') {
        setNetwork(event.data?.network || null);
      }
    });

    // Initialize state
    const initialState = monitorRef.current.getState();
    setNetwork(initialState.network);

    return unsubscribe;
  }, []);

  return {
    network,
  };
}