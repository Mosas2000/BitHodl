import { UniversalWalletConnect } from '@/components/UniversalWalletConnect';

export function WalletConnectCTA() {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="w-20 h-20 bg-gradient-to-br from-stacks-blue to-blue-600 bg-opacity-10 rounded-full flex items-center justify-center mb-6 transition-all duration-300 hover:shadow-md hover:scale-105">
        <svg className="w-10 h-10 text-stacks-blue" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
        </svg>
      </div>
      
      <h3 className="text-xl font-semibold text-gray-900 mb-3">Connect Your Wallet</h3>
      <p className="text-sm text-gray-600 text-center mb-8 max-w-md leading-relaxed">
        Link your wallet to start saving Bitcoin and earning rewards through our secure smart contract vault
      </p>
      
      <div className="w-full max-w-md">
        <UniversalWalletConnect />
      </div>
      
      <div className="mt-6 flex items-center space-x-6 text-xs text-gray-500">
        <div className="flex items-center space-x-1 hover:text-green-600 transition-colors duration-200 cursor-pointer">
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Secure Connection</span>
        </div>
        <div className="flex items-center space-x-1 hover:text-blue-600 transition-colors duration-200 cursor-pointer">
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>Encrypted</span>
        </div>
        <div className="flex items-center space-x-1 hover:text-purple-600 transition-colors duration-200 cursor-pointer">
          <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>Fast & Reliable</span>
        </div>
      </div>
    </div>
  );
}