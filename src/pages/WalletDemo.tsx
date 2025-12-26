import { WalletConnect } from '@/components/WalletConnect';
import { WalletConnectCTA } from '@/components/WalletConnectCTA';
import { useStacksWallet } from '@/hooks/useStacksWallet';

export function WalletDemo() {
  const { isAuthenticated } = useStacksWallet();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Stacks Wallet Connection Demo
          </h1>
          <p className="text-lg text-gray-600">
            Examples of wallet connection components for the Bitcoin Savings DApp
          </p>
        </div>

        {/* Navigation Bar Example */}
        <div className="bg-white shadow rounded-lg p-4 mb-8">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Navigation Bar</h2>
            <WalletConnect />
          </div>
        </div>

        {/* CTA Component Example */}
        {!isAuthenticated && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Call-to-Action Component</h2>
            <WalletConnectCTA />
          </div>
        )}

        {/* Connected State Example */}
        {isAuthenticated && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Connected State</h2>
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-green-800">
                ✓ Wallet is connected. You can now interact with the savings contract.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}