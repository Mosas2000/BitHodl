import { useState, useEffect, useRef } from 'react';
import { useAppKit, useAppKitAccount } from '@/config/stacksAppkit';
import { formatAddress, formatSTX } from '@/utils/stacks';

export function AccountButton() {
  const [balance, setBalance] = useState<number>(0);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Reown AppKit hooks
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();


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

  const handleAccountClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Open AppKit account modal on all devices
    open();
  };

  const copyAddress = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (address) {
      navigator.clipboard.writeText(address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  const viewOnExplorer = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (address) {
      window.open(`https://explorer.stacks.co/address/${address}?chain=mainnet`, '_blank');
    }
  };

  if (!isConnected || !address) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleAccountClick}
        className="group flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-stacks-blue to-stacks-dark text-white rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-stacks-blue focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        aria-label="Account details"
      >
        {/* Connection indicator */}
        <div className="relative flex-shrink-0">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <div className="absolute inset-0 w-2 h-2 bg-green-400 rounded-full animate-ping opacity-75"></div>
        </div>
        
        {/* Address - shown on all screen sizes */}
        <span className="text-xs sm:text-sm font-medium text-white truncate max-w-20 sm:max-w-none">
          {formatAddress(address, 4)}
        </span>
        
        {/* Balance - hidden on extra small screens */}
        <div className="hidden sm:block flex-shrink-0">
          {isBalanceLoading ? (
            <div className="animate-pulse h-3 sm:h-4 w-12 sm:w-16 bg-white/30 rounded"></div>
          ) : (
            <span className="text-xs sm:text-sm text-white/90">
              {formatSTX(balance, 3)} STX
            </span>
          )}
        </div>
        
        {/* Account icon */}
        <svg
          className="w-4 h-4 text-white/80 group-hover:text-white transition-colors"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </button>
      
      {/* Quick actions tooltip - shown on hover */}
      <div className="absolute right-0 mt-2 p-2 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap">
        <div className="flex flex-col space-y-1">
          <button
            onClick={copyAddress}
            className="flex items-center space-x-2 hover:text-stacks-orange transition-colors px-2 py-1 rounded"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>{copiedAddress ? 'Copied!' : 'Copy Address'}</span>
          </button>
          <button
            onClick={viewOnExplorer}
            className="flex items-center space-x-2 hover:text-stacks-orange transition-colors px-2 py-1 rounded"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <span>View on Explorer</span>
          </button>
        </div>
      </div>
    </div>
  );
}