import { useState, useEffect } from 'react';
import { useStacksWallet } from '@/hooks/useStacksWallet';
import { useAppKit, useAppKitAccount, useDisconnect } from '@/config/appkit';
import { formatAddress, formatSTX } from '@/utils/stacks';

export function UniversalWalletConnect() {
  const [showWalletOptions, setShowWalletOptions] = useState(false);
  const [walletType, setWalletType] = useState<'stacks' | 'ethereum' | null>(null);
  
  // Stacks wallet hooks
  const {
    user: stacksUser,
    isLoading: stacksLoading,
    isConnecting: stacksConnecting,
    error: stacksError,
    connectWallet: connectStacksWallet,
    disconnectWallet: disconnectStacksWallet,
    clearError: clearStacksError,
    isAuthenticated: isStacksAuthenticated,
    balance: stacksBalance,
    isBalanceLoading: stacksBalanceLoading
  } = useStacksWallet();
  
  // AppKit wallet hooks
  const { open: openAppKit } = useAppKit();
  const { address: ethAddress, isConnected: isEthConnected } = useAppKitAccount();
  const { disconnect: disconnectEthWallet } = useDisconnect();

  // Close wallet options dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowWalletOptions(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showWalletOptions]);

  // Determine which wallet is currently active
  const activeWallet = isStacksAuthenticated ? 'stacks' : isEthConnected ? 'ethereum' : null;
  const isLoading = stacksLoading || stacksConnecting;

  const handleConnectStacks = () => {
    setWalletType('stacks');
    connectStacksWallet();
    setShowWalletOptions(false);
  };

  const handleConnectEthereum = () => {
    setWalletType('ethereum');
    openAppKit();
    setShowWalletOptions(false);
  };

  const handleDisconnect = () => {
    if (activeWallet === 'stacks') {
      disconnectStacksWallet();
    } else if (activeWallet === 'ethereum') {
      disconnectEthWallet();
    }
    setWalletType(null);
  };

  const clearError = () => {
    if (walletType === 'stacks' || stacksError) {
      clearStacksError();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-200">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-stacks-blue"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            {stacksConnecting ? 'Connecting to wallet...' : 'Initializing...'}
          </span>
        </div>
      </div>
    );
  }

  if (stacksError) {
    return (
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-red-100 dark:border-red-900/30 transition-colors duration-200">
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-red-600 dark:text-red-400 font-medium">{stacksError.message}</span>
            </div>
            <button
              onClick={clearError}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
              title="Dismiss error"
              aria-label="Dismiss error message"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleConnectStacks}
              className="btn-primary text-sm transition-all duration-200 hover:shadow-md transform hover:-translate-y-0.5 flex-1"
              aria-label="Try connecting wallet again"
            >
              Try Again
            </button>
            <button
              onClick={clearError}
              className="btn-secondary text-sm transition-all duration-200 hover:shadow-md transform hover:-translate-y-0.5"
              aria-label="Dismiss error message"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show connected wallet state
  if (activeWallet && (stacksUser || ethAddress)) {
    const isStacks = activeWallet === 'stacks';
    const address = isStacks ? stacksUser?.address : ethAddress;
    const balance = isStacks ? stacksBalance : 0; // ETH balance would need separate implementation
    const isBalanceLoading = isStacks ? stacksBalanceLoading : false;
    const userName = isStacks ? stacksUser?.profile?.name : 'Ethereum User';

    return (
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="wallet-avatar relative group">
              <span className="text-white text-sm font-bold">
                {userName?.charAt(0) || address?.charAt(0)}
              </span>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"></div>
              <div className="absolute inset-0 rounded-full bg-white dark:bg-gray-800 opacity-0 group-hover:opacity-20 transition-opacity duration-200"></div>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {userName || `${isStacks ? 'Stacks' : 'Ethereum'} User`}
              </p>
              <p className="wallet-address hover:text-stacks-blue dark:hover:text-blue-400 transition-colors duration-200 cursor-pointer" title={address}>
                {address ? formatAddress(address) : ''}
              </p>
              <div className="flex items-center mt-1 space-x-2">
                {isBalanceLoading ? (
                  <div className="animate-pulse h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                ) : (
                  <>
                    {isStacks && (
                      <span className="wallet-balance hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 cursor-pointer">
                        {formatSTX(balance)} STX
                      </span>
                    )}
                    <button
                      onClick={() => window.open(
                        isStacks 
                          ? `https://explorer.stacks.co/address/${address}?chain=mainnet`
                          : `https://etherscan.io/address/${address}`,
                        '_blank'
                      )}
                      className="text-xs text-gray-400 hover:text-stacks-blue dark:hover:text-blue-400 transition-all duration-200 hover:scale-110"
                      title="View on Explorer"
                      aria-label="View address on Explorer"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={handleDisconnect}
            className="btn-secondary text-sm transition-all duration-200 hover:shadow-md transform hover:-translate-y-0.5 flex items-center space-x-1 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-800 hover:text-red-600 dark:hover:text-red-400"
            aria-label="Disconnect wallet"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Disconnect</span>
          </button>
        </div>
      </div>
    );
  }

  // Show wallet connection options
  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowWalletOptions(!showWalletOptions);
        }}
        className="btn-primary transition-all duration-200 hover:shadow-md transform hover:-translate-y-0.5 font-medium w-full sm:w-auto flex items-center justify-center space-x-2 group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        aria-expanded={showWalletOptions}
        aria-haspopup="menu"
        aria-label="Connect wallet options"
      >
        <svg className="w-5 h-5 group-hover:rotate-12 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <span>Connect Wallet</span>
      </button>
      
      {showWalletOptions && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 z-10 overflow-hidden transform transition-all duration-200 scale-100 opacity-100" role="menu" aria-label="Wallet options">
          <div className="p-2">
            <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Stacks Wallets
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleConnectStacks();
              }}
              className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-200 dark:hover:border-orange-800 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              role="menuitem"
              aria-label="Connect with Stacks Wallet"
            >
              <div className="w-10 h-10 bg-stacks-orange rounded-md flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow duration-200">
                <span className="text-white font-bold">S</span>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-orange-600 dark:hover:text-orange-400 transition-colors duration-200">Stacks Wallet</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Connect with Hiro, Xverse, or other Stacks wallets</p>
              </div>
              <svg className="w-4 h-4 text-gray-400 group-hover:text-orange-500 transition-colors duration-200 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            <div className="px-3 py-2 mt-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Ethereum Wallets
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleConnectEthereum();
              }}
              className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              role="menuitem"
              aria-label="Connect with Ethereum Wallet"
            >
              <div className="w-10 h-10 bg-blue-500 rounded-md flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow duration-200">
                <span className="text-white font-bold">Ξ</span>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200">Ethereum Wallet</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Connect with MetaMask, WalletConnect, or other Ethereum wallets</p>
              </div>
              <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors duration-200 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-100 dark:border-gray-600">
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              By connecting a wallet, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      )}
    </div>
  );
}