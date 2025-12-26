import { useState } from 'react'
import { Navigation } from '@/components/Navigation'
import { WalletConnect } from '@/components/WalletConnect'
import { Dashboard } from '@/pages/Dashboard'
import { Setup } from '@/pages/Setup'
import { History } from '@/pages/History'
import { useNetworkDetection } from '@/hooks/useNetworkDetection'
import { useWalletMonitor } from '@/hooks/useWalletMonitor'
import { ToastProvider } from '@/hooks/useToast'
import { ErrorBoundary, WalletErrorBoundary, TransactionErrorBoundary } from '@/components/ErrorBoundary'
import { DarkModeProvider } from '@/contexts/DarkModeContext'
import { ErrorTestPanel } from '@/components/ErrorTestPanel'
import { useAppKitAccount } from '@/config/stacksAppkit'
import { useAppKitWallet } from '@/hooks/useAppKitWallet'

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [showErrorTests, setShowErrorTests] = useState(false)
  const { isConnected: isAppKitConnected } = useAppKitAccount()
  const { isAuthenticated, error, getErrorMessage, requiresReconnection } = useAppKitWallet()
  const { isValidNetwork, networkErrorMessage, switchToExpectedNetwork } = useNetworkDetection()
  const { isWalletInstalled } = useWalletMonitor()

  const renderPage = () => {
    // Show wallet not installed error
    if (!isWalletInstalled) {
      return (
        <div className="text-center py-12">
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <div className="w-20 h-20 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                No Wallet Found
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                No Stacks wallet detected. Please install a compatible wallet like Hiro or Xverse to continue.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <a
                  href="https://hiro.so/wallet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Install Hiro Wallet
                </a>
                <a
                  href="https://www.xverse.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Install Xverse Wallet
                </a>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Show network error
    if (!isValidNetwork && networkErrorMessage) {
      return (
        <div className="text-center py-12">
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <div className="w-20 h-20 bg-yellow-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Wrong Network
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                {networkErrorMessage}
              </p>
              <button
                onClick={switchToExpectedNetwork}
                className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Switch to Mainnet
              </button>
            </div>
          </div>
        </div>
      )
    }

    // Show wallet connection error
    if (error && requiresReconnection()) {
      return (
        <div className="text-center py-12">
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <div className="w-20 h-20 bg-orange-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-10 h-10 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Connection Issue
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                {getErrorMessage()}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Reconnect Wallet
              </button>
            </div>
          </div>
        </div>
      )
    }

    if (!isAuthenticated || !isAppKitConnected) {
      return (
        <div className="text-center py-12">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <div className="w-20 h-20 bg-stacks-orange rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1.81.45 1.61 1.67 1.61 1.16 0 1.6-.64 1.6-1.46 0-.84-.68-1.22-1.88-1.54-1.76-.49-3.28-1.25-3.28-3.31 0-1.78 1.32-2.94 3.11-3.21V5h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.63-1.63-1.63-1.01 0-1.46.54-1.46 1.34 0 .74.54 1.13 1.75 1.46 1.82.49 3.42 1.15 3.42 3.37 0 1.87-1.34 3.03-3.2 3.21z"/>
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome to BitHodl
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Hodl your Bitcoin securely with our smart contracts on the Stacks blockchain.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-stacks-blue mb-2">5.0%</div>
                  <div className="text-sm text-gray-600">Annual APY</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-stacks-orange mb-2">Secure</div>
                  <div className="text-sm text-gray-600">Clarity Smart Contracts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-2">Instant</div>
                  <div className="text-sm text-gray-600">No Lock-up Period</div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="text-left">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Why Choose Bitcoin Savings?</h3>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Secure Bitcoin storage with smart contracts</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>No minimum hodl requirements</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Withdraw your Bitcoin anytime without penalties</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Transparent and audited smart contracts</span>
                  </li>
                </ul>
              </div>
              
              <WalletConnect />
            </div>
          </div>
        </div>
      )
    }

    switch (currentPage) {
      case 'dashboard':
        return (
          <TransactionErrorBoundary>
            <Dashboard />
          </TransactionErrorBoundary>
        )
      case 'setup':
        return (
          <WalletErrorBoundary>
            <Setup />
          </WalletErrorBoundary>
        )
      case 'history':
        return (
          <WalletErrorBoundary>
            <History />
          </WalletErrorBoundary>
        )
      default:
        return (
          <TransactionErrorBoundary>
            <Dashboard />
          </TransactionErrorBoundary>
        )
    }
  }

  return (
    <ErrorBoundary>
      <DarkModeProvider>
        <ToastProvider>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            <Navigation
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              extraActions={
                <button
                  onClick={() => setShowErrorTests(true)}
                  className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Test Errors
                </button>
              }
            />
            
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {renderPage()}
            </main>
            
            <ErrorTestPanel
              isVisible={showErrorTests}
              onClose={() => setShowErrorTests(false)}
            />
          </div>
        </ToastProvider>
      </DarkModeProvider>
    </ErrorBoundary>
  )
}

export default App
