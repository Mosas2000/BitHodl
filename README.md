# BitHodl - Stacks Blockchain

A Bitcoin hodling application built on the Stacks blockchain using Clarity smart contracts, React, TypeScript, and TailwindCSS.

## What the App Does

The BitHodl App allows users to:
- Deposit STX tokens into a secure smart contract to earn interest
- Withdraw funds anytime without lock-up periods
- Track savings performance through an intuitive dashboard
- Create automated savings plans with Dollar Cost Averaging (DCA)
- View transaction history and earnings over time
- Connect with popular Stacks wallets (Hiro, Xverse)

The smart contract calculates interest at 5% APY based on deposit duration, with interest accruing continuously and available upon withdrawal.

## How to Run It Locally

### Prerequisites

- Node.js 18+
- npm or yarn
- A Stacks-compatible wallet (Hiro Wallet or Xverse)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd bitcoin-savings-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

5. Connect your wallet:
   - Install Hiro Wallet (https://hiro.so/wallet) or Xverse (https://www.xverse.app/)
   - Ensure your wallet is set to Stacks Testnet
   - Click "Connect Wallet" in the app

## How to Deploy

### Smart Contract Deployment

1. Install Clarinet CLI:
```bash
curl -L https://github.com/hirosystems/clarinet/releases/latest/download/clarinet-linux-x64.tar.gz | tar xz
sudo mv clarinet-linux-x64/clarinet /usr/local/bin/
```

2. Deploy to testnet:
```bash
cd contracts
clarinet contract deploy --testnet
```

3. Update contract addresses in `src/utils/stacks.ts`:
```typescript
export const CONTRACT_ADDRESS = {
  mainnet: 'YOUR_MAINNET_CONTRACT_ADDRESS',
  testnet: 'YOUR_DEPLOYED_TESTNET_ADDRESS', // Update this
};
```

### Frontend Deployment

1. Build for production:
```bash
npm run build
```

2. Deploy to your preferred hosting service (Vercel, Netlify, etc.):
```bash
# For Vercel
npm install -g vercel
vercel --prod

# For Netlify
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

3. Configure environment variables:
   - `VITE_STACKS_NETWORK`: Set to 'mainnet' or 'testnet'
   - `VITE_CONTRACT_ADDRESS`: Set to your deployed contract address

## Contract Addresses

### Testnet
- **Contract Address**: `YOUR_TESTNET_CONTRACT_ADDRESS` (Update after deployment)
- **Explorer**: https://explorer.stacks.co/txid/CONTRACT_ADDRESS?chain=testnet
- **Network**: Stacks Testnet

### Mainnet
- **Contract Address**: `YOUR_MAINNET_CONTRACT_ADDRESS` (To be deployed)
- **Explorer**: https://explorer.stacks.co/txid/CONTRACT_ADDRESS?chain=mainnet
- **Network**: Stacks Mainnet

## Project Structure

```
├── contracts/
│    └── clarity/
│       └── bithodl.clar    # Main savings contract
├── src/
│   ├── components/
│   │   ├── WalletConnect.tsx       # Wallet connection component
│   │   ├── SavingsDashboard.tsx    # Dashboard with stats
│   │   └── TransactionForm.tsx     # Deposit/Withdraw forms
│   ├── hooks/
│   │   ├── useStacksWallet.ts      # Wallet connection hook
│   │   └── useSavingsContract.ts   # Contract interaction hook
│   ├── utils/
│   │   └── stacks.ts               # Stacks utility functions
│   ├── types/
│   │   └── index.ts                # TypeScript type definitions
│   ├── App.tsx                     # Main application component
│   ├── main.tsx                    # React entry point
│   └── index.css                   # Global styles with Tailwind
├── public/                         # Static assets
├── package.json                   # Dependencies and scripts
├── tsconfig.json                   # TypeScript configuration
├── vite.config.ts                  # Vite build configuration
├── tailwind.config.js              # TailwindCSS configuration
└── postcss.config.js               # PostCSS configuration
```

## Smart Contract

The `bithodl.clar` contract provides:

- **Deposit Function**: Stake STX tokens to earn interest
- **Withdraw Function**: Withdraw your STX and earned interest anytime
- **Interest Calculation**: 5% APY calculated based on deposit duration
- **Owner Functions**: Set interest rates and transfer ownership

### Contract Functions

- `deposit(amount)`: Deposit STX into savings
- `withdraw(amount)`: Withdraw STX from savings
- `get-user-balance(user)`: Get user's total balance (principal + interest)
- `get-total-deposits()`: Get total deposits in contract
- `get-interest-rate()`: Get current interest rate

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Configuration

- **Network**: Currently configured for Stacks testnet
- **Contract Address**: Update in `src/utils/stacks.ts` after deployment
- **Interest Rate**: Set by contract owner (default 5% APY)

## Technology Stack

- **Blockchain**: Stacks
- **Smart Contract Language**: Clarity
- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Blockchain Integration**: @stacks/connect, @stacks/transactions
- **App Name**: BitHodl

## Security Considerations

- Smart contract audits recommended before mainnet deployment
- Never share private keys or seed phrases
- Test thoroughly on testnet before using real funds
- Consider implementing additional security measures like multi-sig

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Disclaimer

This software is for educational purposes. Use at your own risk and never invest more than you can afford to lose.