import { createError, ErrorType } from './errors';

export interface WalletInfo {
  address: string;
  network: string;
  balance?: number;
}

export interface WalletState {
  isConnected: boolean;
  isInstalled: boolean;
  currentAccount: string | null;
  network: string | null;
  isLocked: boolean;
  lastActivity: number;
}

export interface WalletEvent {
  type: 'connected' | 'disconnected' | 'accountChanged' | 'networkChanged' | 'locked' | 'unlocked';
  data?: any;
}

export class WalletMonitor {
  private static instance: WalletMonitor;
  private state: WalletState;
  private listeners: Set<(event: WalletEvent) => void> = new Set();
  private activityTimer: NodeJS.Timeout | null = null;
  private checkInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.state = {
      isConnected: false,
      isInstalled: false,
      currentAccount: null,
      network: null,
      isLocked: false,
      lastActivity: Date.now(),
    };

    // Initialize wallet detection
    this.detectWallets();
    
    // Set up periodic checks
    this.startPeriodicChecks();
  }

  static getInstance(): WalletMonitor {
    if (!WalletMonitor.instance) {
      WalletMonitor.instance = new WalletMonitor();
    }
    return WalletMonitor.instance;
  }

  // Detect available wallets
  private detectWallets(): void {
    if (typeof window === 'undefined') return;

    const hasHiroWallet = !!(window as any).HiroWalletProvider;
    const hasXverseWallet = !!(window as any).StacksProvider;
    
    this.state.isInstalled = hasHiroWallet || hasXverseWallet;
  }

  // Start periodic checks for wallet state
  private startPeriodicChecks(): void {
    if (this.checkInterval) return;

    this.checkInterval = setInterval(() => {
      this.checkWalletState();
    }, 5000); // Check every 5 seconds
  }

  // Stop periodic checks
  private stopPeriodicChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  // Check current wallet state
  private async checkWalletState(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      let isConnected = false;
      let currentAccount = null;
      let network = null;

      // Check Hiro Wallet
      if ((window as any).HiroWalletProvider) {
        const hiroWallet = (window as any).HiroWalletProvider;
        isConnected = await hiroWallet.isConnected();
        if (isConnected) {
          const userData = await hiroWallet.getUserData();
          currentAccount = userData?.profile?.stxAddress || null;
          network = await hiroWallet.getNetwork();
        }
      }
      // Check Xverse Wallet
      else if ((window as any).StacksProvider) {
        const stacksProvider = (window as any).StacksProvider;
        isConnected = await stacksProvider.isConnected();
        if (isConnected) {
          const userData = await stacksProvider.getUserData();
          currentAccount = userData?.profile?.stxAddress || null;
          network = await stacksProvider.getNetwork();
        }
      }

      // Check for state changes
      const previousState = { ...this.state };
      
      this.state.isConnected = isConnected;
      this.state.currentAccount = currentAccount;
      this.state.network = network;

      // Emit events for state changes
      if (previousState.isConnected !== isConnected) {
        if (isConnected) {
          this.emitEvent({ type: 'connected', data: { account: currentAccount, network } });
        } else {
          this.emitEvent({ type: 'disconnected' });
        }
      }

      if (previousState.currentAccount !== currentAccount && currentAccount && previousState.isConnected) {
        this.emitEvent({ type: 'accountChanged', data: { account: currentAccount } });
      }

      if (previousState.network !== network && network && previousState.isConnected) {
        this.emitEvent({ type: 'networkChanged', data: { network } });
      }
    } catch (error) {
      console.error('Error checking wallet state:', error);
    }
  }

  // Emit event to listeners
  private emitEvent(event: WalletEvent): void {
    this.state.lastActivity = Date.now();
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in wallet event listener:', error);
      }
    });
  }

  // Subscribe to wallet events
  subscribe(callback: (event: WalletEvent) => void): () => void {
    this.listeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  // Get current wallet state
  getState(): WalletState {
    return { ...this.state };
  }

  // Check if wallet is installed
  isWalletInstalled(): boolean {
    return this.state.isInstalled;
  }

  // Check if wallet is connected
  isWalletConnected(): boolean {
    return this.state.isConnected;
  }

  // Get current account
  getCurrentAccount(): string | null {
    return this.state.currentAccount;
  }

  // Get current network
  getCurrentNetwork(): string | null {
    return this.state.network;
  }

  // Check if wallet is locked (if supported)
  async isWalletLocked(): Promise<boolean> {
    try {
      if ((window as any).HiroWalletProvider) {
        const hiroWallet = (window as any).HiroWalletProvider;
        // Hiro doesn't expose lock state directly, so we'll try a simple operation
        try {
          await hiroWallet.getUserData();
          return false;
        } catch {
          return true;
        }
      }
      
      if ((window as any).StacksProvider) {
        const stacksProvider = (window as any).StacksProvider;
        try {
          await stacksProvider.getUserData();
          return false;
        } catch {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking wallet lock state:', error);
      return false;
    }
  }

  // Force refresh wallet state
  async refreshState(): Promise<void> {
    await this.checkWalletState();
  }

  // Monitor wallet for disconnection during transaction
  monitorTransaction(onDisconnect: () => void): () => void {
    let wasConnected = this.state.isConnected;
    
    const unsubscribe = this.subscribe((event) => {
      if (event.type === 'disconnected' && wasConnected) {
        onDisconnect();
      }
      wasConnected = event.type !== 'disconnected';
    });

    return unsubscribe;
  }

  // Monitor for account changes during transaction
  monitorAccountChange(onAccountChange: (newAccount: string) => void): () => void {
    const unsubscribe = this.subscribe((event) => {
      if (event.type === 'accountChanged' && event.data?.account) {
        onAccountChange(event.data.account);
      }
    });

    return unsubscribe;
  }

  // Monitor for network changes during transaction
  monitorNetworkChange(onNetworkChange: (newNetwork: string) => void): () => void {
    const unsubscribe = this.subscribe((event) => {
      if (event.type === 'networkChanged' && event.data?.network) {
        onNetworkChange(event.data.network);
      }
    });

    return unsubscribe;
  }

  // Get wallet info for error reporting
  async getWalletInfo(): Promise<WalletInfo | null> {
    if (!this.state.isConnected || !this.state.currentAccount) {
      return null;
    }

    try {
      return {
        address: this.state.currentAccount,
        network: this.state.network || 'unknown',
      };
    } catch (error) {
      console.error('Error getting wallet info:', error);
      return null;
    }
  }

  // Create error with wallet context
  createWalletError(errorType: ErrorType, details?: any): Error {
    const walletInfo = this.getWalletInfo();
    return createError(errorType, {
      ...details,
      walletInfo,
      timestamp: Date.now(),
    });
  }

  // Cleanup
  destroy(): void {
    this.stopPeriodicChecks();
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
      this.activityTimer = null;
    }
    this.listeners.clear();
  }
}

// Export singleton instance
export const walletMonitor = WalletMonitor.getInstance();

// Utility functions for common wallet monitoring scenarios
export function monitorWalletDuringTransaction<T>(
  transactionPromise: Promise<T>,
  options: {
    onDisconnect?: () => void;
    onAccountChange?: (newAccount: string) => void;
    onNetworkChange?: (newNetwork: string) => void;
  }
): Promise<T> {
  return new Promise((resolve, reject) => {
    const unsubscribers: (() => void)[] = [];

    // Set up monitors
    if (options.onDisconnect) {
      unsubscribers.push(walletMonitor.monitorTransaction(options.onDisconnect));
    }

    if (options.onAccountChange) {
      unsubscribers.push(walletMonitor.monitorAccountChange(options.onAccountChange));
    }

    if (options.onNetworkChange) {
      unsubscribers.push(walletMonitor.monitorNetworkChange(options.onNetworkChange));
    }

    // Execute transaction
    transactionPromise
      .then((result) => {
        // Clean up monitors
        unsubscribers.forEach(unsubscribe => unsubscribe());
        resolve(result);
      })
      .catch((error) => {
        // Clean up monitors
        unsubscribers.forEach(unsubscribe => unsubscribe());
        reject(error);
      });
  });
}

// Hook for React components to use wallet monitoring
export function createWalletMonitorHook() {
  const monitor = walletMonitor;
  
  return {
    getState: () => monitor.getState(),
    isWalletInstalled: () => monitor.isWalletInstalled(),
    isWalletConnected: () => monitor.isWalletConnected(),
    getCurrentAccount: () => monitor.getCurrentAccount(),
    getCurrentNetwork: () => monitor.getCurrentNetwork(),
    isWalletLocked: () => monitor.isWalletLocked(),
    refreshState: () => monitor.refreshState(),
    subscribe: (callback: (event: WalletEvent) => void) => monitor.subscribe(callback),
    monitorTransaction: (onDisconnect: () => void) => monitor.monitorTransaction(onDisconnect),
    monitorAccountChange: (onAccountChange: (newAccount: string) => void) => monitor.monitorAccountChange(onAccountChange),
    monitorNetworkChange: (onNetworkChange: (newNetwork: string) => void) => monitor.monitorNetworkChange(onNetworkChange),
    getWalletInfo: () => monitor.getWalletInfo(),
    createWalletError: (errorType: ErrorType, details?: any) => monitor.createWalletError(errorType, details),
  };
}