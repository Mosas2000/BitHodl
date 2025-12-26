import { useState, useEffect, useCallback } from 'react';
import { 
  NetworkType, 
  NetworkConfig, 
  NETWORK_CONFIGS, 
  networkDetector, 
  networkMonitor,
  validateNetworkForTransaction 
} from '@/utils/network';
import { createError, ErrorType, getErrorMessage } from '@/utils/errors';

export interface NetworkStatus {
  isOnline: boolean;
  isConnected: boolean;
  latency: number;
  error?: string;
}

export interface UseNetworkDetectionOptions {
  expectedNetwork?: NetworkType;
  monitorInterval?: number;
  autoValidate?: boolean;
}

export function useNetworkDetection(options: UseNetworkDetectionOptions = {}) {
  const {
    expectedNetwork = 'mainnet',
    autoValidate = true,
  } = options;

  const [currentNetwork, setCurrentNetwork] = useState<NetworkType | null>(null);
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isConnected: false,
    latency: -1,
  });
  const [isValidNetwork, setIsValidNetwork] = useState<boolean>(false);
  const [networkError, setNetworkError] = useState<Error | null>(null);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);

  // Detect current network
  const detectNetwork = useCallback(async (): Promise<NetworkType> => {
    setIsDetecting(true);
    try {
      const network = await networkDetector.detectWalletNetwork();
      setCurrentNetwork(network);
      networkDetector.setCurrentNetwork(network);
      
      // Validate network if expected network is set
      if (autoValidate && expectedNetwork) {
        const validation = validateNetworkForTransaction(network, expectedNetwork);
        setIsValidNetwork(validation.isValid);
        if (validation.error) {
          setNetworkError(validation.error);
        } else {
          setNetworkError(null);
        }
      }
      
      return network;
    } catch (error) {
      console.error('Failed to detect network:', error);
      const appError = createError(ErrorType.WRONG_NETWORK, { 
        originalError: error 
      });
      setNetworkError(appError);
      return 'mainnet'; // Default fallback
    } finally {
      setIsDetecting(false);
    }
  }, [expectedNetwork, autoValidate]);

  // Validate network connectivity
  const validateConnectivity = useCallback(async (network: NetworkType): Promise<boolean> => {
    try {
      const isConnected = await networkDetector.validateNetworkConnectivity(network);
      setNetworkStatus(prev => ({ ...prev, isConnected }));
      return isConnected;
    } catch (error) {
      console.error('Failed to validate connectivity:', error);
      setNetworkStatus(prev => ({ 
        ...prev, 
        isConnected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
      return false;
    }
  }, []);

  // Test network latency
  const testLatency = useCallback(async (network: NetworkType): Promise<number> => {
    try {
      const latency = await networkDetector.testNetworkLatency(network);
      setNetworkStatus(prev => ({ ...prev, latency }));
      return latency;
    } catch (error) {
      console.error('Failed to test latency:', error);
      setNetworkStatus(prev => ({ ...prev, latency: -1 }));
      return -1;
    }
  }, []);

  // Get comprehensive network status
  const getNetworkStatus = useCallback(async (network: NetworkType): Promise<NetworkStatus> => {
    try {
      const status = await networkDetector.getNetworkStatus(network);
      setNetworkStatus(status);
      return status;
    } catch (error) {
      console.error('Failed to get network status:', error);
      const errorStatus: NetworkStatus = {
        isOnline: navigator.onLine,
        isConnected: false,
        latency: -1,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      setNetworkStatus(errorStatus);
      return errorStatus;
    }
  }, []);

  // Switch to expected network
  const switchToExpectedNetwork = useCallback(async (): Promise<boolean> => {
    if (!expectedNetwork) return false;
    
    try {
      // In a real implementation, you would prompt the user to switch networks
      // For now, we'll just validate and update the state
      const validation = validateNetworkForTransaction(expectedNetwork, expectedNetwork);
      setIsValidNetwork(validation.isValid);
      
      if (validation.isValid) {
        setCurrentNetwork(expectedNetwork);
        networkDetector.setCurrentNetwork(expectedNetwork);
        setNetworkError(null);
        return true;
      } else {
        setNetworkError(validation.error || null);
        return false;
      }
    } catch (error) {
      console.error('Failed to switch network:', error);
      const appError = createError(ErrorType.WRONG_NETWORK, { 
        originalError: error 
      });
      setNetworkError(appError);
      return false;
    }
  }, [expectedNetwork]);

  // Clear network error
  const clearNetworkError = useCallback(() => {
    setNetworkError(null);
  }, []);

  // Get network configuration
  const getNetworkConfig = useCallback((network: NetworkType): NetworkConfig => {
    return NETWORK_CONFIGS[network];
  }, []);

  // Get explorer URL for transaction
  const getExplorerUrl = useCallback((txId: string, network?: NetworkType): string => {
    const net = network || currentNetwork || 'mainnet';
    const config = getNetworkConfig(net);
    return `${config.explorerUrl}/txid/${txId}?chain=${net}`;
  }, [currentNetwork, getNetworkConfig]);

  // Initialize network detection
  useEffect(() => {
    const initializeNetwork = async () => {
      await detectNetwork();
      if (currentNetwork) {
        await getNetworkStatus(currentNetwork);
      }
    };

    initializeNetwork();
  }, [detectNetwork, getNetworkStatus, currentNetwork]);

  // Monitor online/offline status
  useEffect(() => {
    const unsubscribe = networkDetector.onOnlineStatusChange((isOnline) => {
      setNetworkStatus(prev => ({ ...prev, isOnline }));
      
      // Re-validate connectivity when coming back online
      if (isOnline && currentNetwork) {
        validateConnectivity(currentNetwork);
      }
    });

    return unsubscribe;
  }, [currentNetwork, validateConnectivity]);

  // Monitor network status
  useEffect(() => {
    if (!currentNetwork) return;

    const unsubscribe = networkMonitor.onStatusUpdate(currentNetwork, (status) => {
      setNetworkStatus(status);
    });

    return unsubscribe;
  }, [currentNetwork]);

  // Auto-detect network when wallet state changes
  useEffect(() => {
    // This would be called when wallet connects/disconnects
    // In a real implementation, you'd listen for wallet events
    const handleWalletChange = async () => {
      await detectNetwork();
    };

    // Set up wallet event listeners if available
    if (typeof window !== 'undefined') {
      // Listen for wallet events
      window.addEventListener('wallet-connected', handleWalletChange);
      window.addEventListener('wallet-disconnected', handleWalletChange);
      window.addEventListener('account-changed', handleWalletChange);

      return () => {
        window.removeEventListener('wallet-connected', handleWalletChange);
        window.removeEventListener('wallet-disconnected', handleWalletChange);
        window.removeEventListener('account-changed', handleWalletChange);
      };
    }
  }, [detectNetwork]);

  return {
    // State
    currentNetwork,
    networkStatus,
    isValidNetwork,
    networkError,
    isDetecting,
    
    // Computed
    isOnline: networkStatus.isOnline,
    isConnected: networkStatus.isConnected,
    latency: networkStatus.latency,
    networkErrorMessage: networkError ? getErrorMessage(networkError) : null,
    
    // Actions
    detectNetwork,
    validateConnectivity,
    testLatency,
    getNetworkStatus,
    switchToExpectedNetwork,
    clearNetworkError,
    
    // Utilities
    getNetworkConfig,
    getExplorerUrl,
    
    // Validation
    validateNetwork: (network: NetworkType) => validateNetworkForTransaction(network, expectedNetwork),
  };
}