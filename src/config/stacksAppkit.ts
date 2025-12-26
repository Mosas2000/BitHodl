import React from 'react'
import { createAppKit } from '@reown/appkit/react'
import { BitcoinAdapter } from '@reown/appkit-adapter-bitcoin'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, sepolia } from '@reown/appkit/networks'
import { bitcoinTestnet, bitcoin } from '@reown/appkit/networks'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'

const PROJECT_ID = '03986a121b1c2d11c4161e05a8c5093d'

// Create Bitcoin adapter for Stacks support
const bitcoinAdapter = new BitcoinAdapter({
  networks: [bitcoin],
  projectId: PROJECT_ID
})

// Create wagmi adapter for Ethereum networks
const wagmiAdapter = new WagmiAdapter({
  networks: [mainnet, sepolia],
  projectId: PROJECT_ID,
  ssr: true
})

// Create query client for wagmi
const queryClient = new QueryClient()

// Create AppKit modal with multi-chain support
createAppKit({
  adapters: [bitcoinAdapter, wagmiAdapter],
  networks: [bitcoin, mainnet, sepolia],
  projectId: PROJECT_ID,
  metadata: {
    name: 'BitHodl',
    description: 'Secure Bitcoin hodling on the Stacks blockchain',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://bithodl.com',
    icons: ['https://bithodl.com/icon.png']
  },
  features: {
    analytics: true,
    email: true,
    socials: ['google', 'github'],
    onramp: false,
    swaps: false,
    emailShowWallets: true
  },
  themeMode: 'light',
  themeVariables: {
    '--w3m-z-index': 9999,
    '--w3m-color-mix': '#0546E0',
    '--w3m-color-mix-strength': 40
  }
})

// Provider component to wrap the app
export function StacksAppKitProvider({ children }: { children: ReactNode }) {
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

// Export the adapters for use in other components
export { bitcoinAdapter, wagmiAdapter }

// Export AppKit utilities for wallet connection
export { useAppKit, useAppKitAccount, useAppKitProvider, useDisconnect } from '@reown/appkit/react'