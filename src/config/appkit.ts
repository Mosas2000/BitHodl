import React from 'react'
import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, sepolia } from '@reown/appkit/networks'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'

const PROJECT_ID = '03986a121b1c2d11c4161e05a8c5093d'

// Create wagmi adapter with Ethereum networks for AppKit
const wagmiAdapter = new WagmiAdapter({
  networks: [mainnet, sepolia],
  projectId: PROJECT_ID,
  ssr: true
})

// Create query client for wagmi
const queryClient = new QueryClient()

// Create AppKit modal for Ethereum wallets
createAppKit({
  adapters: [wagmiAdapter],
  networks: [mainnet, sepolia],
  projectId: PROJECT_ID,
  metadata: {
    name: 'BitHodl',
    description: 'Bitcoin savings on Stacks blockchain',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://bithodl.com',
    icons: ['https://bithodl.com/icon.png']
  },
  features: {
    analytics: true, // Required for challenge tracking
    email: true,
    socials: ['google', 'github'],
    onramp: false, // Disable onramp for now
    swaps: false, // Disable swaps for now
    emailShowWallets: true
  },
  themeMode: 'light',
  themeVariables: {
    '--w3m-z-index': 9999
  }
})

// Provider component to wrap the app
export function AppKitProvider({ children }: { children: ReactNode }) {
  return React.createElement(
    WagmiProvider,
    { config: wagmiAdapter.wagmiConfig },
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    )
  )
}

// Export the wagmi adapter for use in other components
export { wagmiAdapter }

// Export AppKit utilities for wallet connection
export { useAppKit, useAppKitAccount, useAppKitProvider, useDisconnect } from '@reown/appkit/react'