import { createError, ErrorType } from './errors';

export type NetworkType = 'mainnet' | 'testnet';

export interface NetworkConfig {
  name: NetworkType;
  coreApiUrl: string;
  broadcastApiUrl: string;
  explorerUrl: string;
  chainId: number;
}

export const NETWORK_CONFIGS: Record<NetworkType, NetworkConfig> = {
  mainnet: {
    name: 'mainnet',
    coreApiUrl: 'https://api.mainnet.hiro.so/extended/v1',
    broadcastApiUrl: 'https://api.mainnet.hiro.so',
    explorerUrl: 'https://explorer.stacks.co',
    chainId: 1,
  },
  testnet: {
    name: 'testnet',
    coreApiUrl: 'https://api.testnet.hiro.so/extended/v1',
    broadcastApiUrl: 'https://api.testnet.hiro.so',
    explorerUrl: 'https://explorer.stacks.co',
    chainId: 2147483648, // 0x80000000
  },
};

// Network detection utilities
export class NetworkDetector {
  private static instance: NetworkDetector;
  private currentNetwork: NetworkType | null = null;
  private isOnline: boolean = navigator.onLine;
  private listeners: Set<(online: boolean) => void> = new Set();

  private constructor() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnlineChange);
    window.addEventListener('offline', this.handleOnlineChange);
  }

  static getInstance(): NetworkDetector {
    if (!NetworkDetector.instance) {
      NetworkDetector.instance = new NetworkDetector();
    }
    return NetworkDetector.instance;
  }

  private handleOnlineChange = () => {
    const wasOnline = this.isOnline;
    this.isOnline = navigator.onLine;
    
    if (wasOnline !== this.isOnline) {
      this.listeners.forEach(listener => listener(this.isOnline));
    }
  };

  // Check if browser is online
  isBrowserOnline(): boolean {
    return this.isOnline;
  }

  // Subscribe to online/offline changes
  onOnlineStatusChange(callback: (online: boolean) => void): () => void {
    this.listeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  // Detect current network from wallet
  async detectWalletNetwork(): Promise<NetworkType> {
    try {
      // Try to get network from different wallet providers
      if ((window as any).HiroWalletProvider) {
        const hiroWallet = (window as any).HiroWalletProvider;
        const network = await hiroWallet.getNetwork();
        return this.normalizeNetworkName(network);
      }
      
      if ((window as any).StacksProvider) {
        const stacksProvider = (window as any).StacksProvider;
        const network = await stacksProvider.getNetwork();
        return this.normalizeNetworkName(network);
      }
      
      // Default to mainnet if no wallet is connected
      return 'mainnet';
    } catch (error) {
      console.error('Failed to detect wallet network:', error);
      return 'mainnet';
    }
  }

  // Normalize network name from different wallet providers
  private normalizeNetworkName(network: any): NetworkType {
    if (typeof network === 'string') {
      const normalized = network.toLowerCase();
      if (normalized === 'mainnet') return 'mainnet';
      if (normalized === 'testnet') return 'testnet';
    }
    
    if (network && typeof network === 'object') {
      if (network.name) {
        const name = network.name.toLowerCase();
        if (name.includes('mainnet')) return 'mainnet';
        if (name.includes('testnet')) return 'testnet';
      }
      
      if (network.chainId) {
        if (network.chainId === 1) return 'mainnet';
        if (network.chainId === 2147483648) return 'testnet';
      }
    }
    
    // Default to mainnet
    return 'mainnet';
  }

  // Validate network connectivity
  async validateNetworkConnectivity(network: NetworkType): Promise<boolean> {
    try {
      const config = NETWORK_CONFIGS[network];
      
      // Create a timeout controller
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${config.coreApiUrl}/status`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);
      
      return response.ok;
    } catch (error) {
      console.error(`Failed to validate ${network} connectivity:`, error);
      return false;
    }
  }

  // Get current network
  getCurrentNetwork(): NetworkType | null {
    return this.currentNetwork;
  }

  // Set current network
  setCurrentNetwork(network: NetworkType): void {
    this.currentNetwork = network;
  }

  // Check if network matches expected
  validateNetworkMatch(current: NetworkType, expected: NetworkType): boolean {
    return current === expected;
  }

  // Get network validation error
  getNetworkMismatchError(current: NetworkType, expected: NetworkType) {
    return createError(ErrorType.WRONG_NETWORK, {
      currentNetwork: current,
      expectedNetwork: expected,
    });
  }

  // Test network latency
  async testNetworkLatency(network: NetworkType): Promise<number> {
    try {
      const config = NETWORK_CONFIGS[network];
      const startTime = Date.now();
      
      const response = await fetch(`${config.coreApiUrl}/status`, {
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (response.ok) {
        return Date.now() - startTime;
      }
      
      return -1; // Error
    } catch (error) {
      console.error(`Failed to test ${network} latency:`, error);
      return -1; // Error
    }
  }

  // Get network status summary
  async getNetworkStatus(network: NetworkType): Promise<{
    isOnline: boolean;
    isConnected: boolean;
    latency: number;
    error?: string;
  }> {
    const isOnline = this.isBrowserOnline();
    let isConnected = false;
    let latency = -1;
    let error: string | undefined;

    if (isOnline) {
      try {
        isConnected = await this.validateNetworkConnectivity(network);
        if (isConnected) {
          latency = await this.testNetworkLatency(network);
        }
      } catch (err) {
        error = err instanceof Error ? err.message : 'Unknown network error';
      }
    }

    return {
      isOnline,
      isConnected,
      latency,
      error,
    };
  }
}

// Network validation hook utilities
export function validateNetworkForTransaction(
  currentNetwork: NetworkType,
  expectedNetwork: NetworkType
): { isValid: boolean; error?: Error } {
  if (currentNetwork !== expectedNetwork) {
    return {
      isValid: false,
      error: createError(ErrorType.WRONG_NETWORK, {
        currentNetwork: currentNetwork,
        expectedNetwork: expectedNetwork,
      }),
    };
  }

  return { isValid: true };
}

// Network monitoring utilities
export class NetworkMonitor {
  private static instance: NetworkMonitor;
  private monitoringIntervals: Map<NetworkType, NodeJS.Timeout> = new Map();
  private statusCallbacks: Map<NetworkType, Set<(status: any) => void>> = new Map();
  private isMonitoring = false;

  private constructor() {}

  static getInstance(): NetworkMonitor {
    if (!NetworkMonitor.instance) {
      NetworkMonitor.instance = new NetworkMonitor();
    }
    return NetworkMonitor.instance;
  }

  // Start monitoring a network
  startMonitoring(network: NetworkType, intervalMs: number = 30000): void {
    if (this.monitoringIntervals.has(network)) {
      return; // Already monitoring
    }

    const detector = NetworkDetector.getInstance();
    
    const intervalId = setInterval(async () => {
      const status = await detector.getNetworkStatus(network);
      const callbacks = this.statusCallbacks.get(network) || new Set();
      callbacks.forEach(callback => callback(status));
    }, intervalMs);

    this.monitoringIntervals.set(network, intervalId);
    this.isMonitoring = true;
  }

  // Stop monitoring a network
  stopMonitoring(network: NetworkType): void {
    const intervalId = this.monitoringIntervals.get(network);
    if (intervalId) {
      clearInterval(intervalId);
      this.monitoringIntervals.delete(network);
    }

    if (this.monitoringIntervals.size === 0) {
      this.isMonitoring = false;
    }
  }

  // Subscribe to network status updates
  onStatusUpdate(
    network: NetworkType,
    callback: (status: any) => void
  ): () => void {
    if (!this.statusCallbacks.has(network)) {
      this.statusCallbacks.set(network, new Set());
    }

    const callbacks = this.statusCallbacks.get(network)!;
    callbacks.add(callback);

    // Start monitoring if not already monitoring
    if (!this.isMonitoring) {
      this.startMonitoring(network);
    }

    // Return unsubscribe function
    return () => {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.stopMonitoring(network);
      }
    };
  }

  // Get current monitoring status
  isMonitoringNetwork(network: NetworkType): boolean {
    return this.monitoringIntervals.has(network);
  }

  // Stop all monitoring
  stopAllMonitoring(): void {
    this.monitoringIntervals.forEach((_, network) => {
      this.stopMonitoring(network);
    });
  }
}

// Export singleton instances
export const networkDetector = NetworkDetector.getInstance();
export const networkMonitor = NetworkMonitor.getInstance();