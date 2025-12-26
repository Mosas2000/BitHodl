import { useAppKit, useAppKitAccount } from '@reown/appkit/react'
import { useEffect, useState } from 'react'

export function ReownWalletConnect() {
  const { open } = useAppKit()
  const { address, isConnected } = useAppKitAccount()
  const [walletInfo, setWalletInfo] = useState('')

  useEffect(() => {
    if (isConnected && address) {
      setWalletInfo(`${address.slice(0, 6)}...${address.slice(-4)}`)
    } else {
      setWalletInfo('')
    }
  }, [isConnected, address])

  const handleConnect = () => {
    open()
  }

  const handleDisconnect = () => {
    // This will open the wallet modal where users can disconnect
    open({ view: 'Account' })
  }

  return (
    <div className="flex items-center gap-4">
      {isConnected ? (
        <>
          <div className="text-sm font-medium">
            Connected: {walletInfo}
          </div>
          <button
            onClick={handleDisconnect}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Disconnect
          </button>
        </>
      ) : (
        <button
          onClick={handleConnect}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Connect Wallet
        </button>
      )}
    </div>
  )
}
