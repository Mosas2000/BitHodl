import { useState, useEffect } from 'react';
import { useAppKit, useAppKitAccount, useDisconnect } from '@/config/stacksAppkit';
import { formatAddress, formatSTX } from '@/utils/stacks';

export function WalletConnect() {
  const [showWalletOptions, setShowWalletOptions] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  
  // Reown AppKit hooks
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { disconnect } = useDisconnect();

  // Close wallet options dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showWalletOptions) {
        setShowWalletOptions(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showWalletOptions]);

  // Fetch STX balance when connected
  useEffect(() => {
    if (isConnected && address) {
      setIsBalanceLoading(true);
      // Fetch actual STX balance from Hiro API
      const fetchBalance = async () => {
        try {
          const response = await fetch(`https://api.mainnet.hiro.so/extended/v1/address/${address}/stx`);
          const data = await response.json();
          setBalance(data.balance / 1000000); // Convert microSTX to STX
        } catch (error) {
          console.error('Error fetching balance:', error);
          setBalance(0);
        } finally {
          setIsBalanceLoading(false);
        }
      };
      
      fetchBalance();
    } else {
      setBalance(0);
    }
  }, [isConnected, address]);

  const handleConnect = () => {
    open();
    setShowWalletOptions(false);
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      // You could add a toast notification here
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setBalance(0);
  };

  if (isConnected && address) {
    return (
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="wallet-avatar relative group">
              <span className="text-white text-sm font-bold">
                {address.charAt(0).toUpperCase()}
              </span>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"></div>
              <div className="absolute inset-0 rounded-full bg-white dark:bg-gray-800 opacity-0 group-hover:opacity-20 transition-opacity duration-200"></div>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Connected Wallet
              </p>
              <p
                className="wallet-address hover:text-stacks-blue dark:hover:text-blue-400 transition-colors duration-200 cursor-pointer"
                title={address}
                onClick={copyAddress}
              >
                {formatAddress(address)}
              </p>
              <div className="flex items-center mt-1 space-x-2">
                {isBalanceLoading ? (
                  <div className="animate-pulse h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                ) : (
                  <>
                    <span className="wallet-balance hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 cursor-pointer" title="STX Balance">
                      {formatSTX(balance)} STX
                    </span>
                    <button
                      onClick={() => window.open(`https://explorer.stacks.co/address/${address}?chain=mainnet`, '_blank')}
                      className="text-xs text-gray-400 hover:text-stacks-blue dark:hover:text-blue-400 transition-all duration-200 hover:scale-110"
                      title="View on Explorer"
                      aria-label="View address on Stacks Explorer"
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

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleConnect();
        }}
        className="btn-primary transition-all duration-200 hover:shadow-md transform hover:-translate-y-0.5 font-medium w-full sm:w-auto flex items-center justify-center space-x-2 group focus:outline-none focus:ring-2 focus:ring-stacks-blue focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        aria-label="Connect wallet to BitHodl"
      >
        <svg className="w-5 h-5 group-hover:rotate-12 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <span>Connect to BitHodl</span>
      </button>
    </div>
  );
}
