/**
 * Contract configuration for Bitcoin Savings dApp
 * Contains contract addresses for different networks
 */

// Contract addresses (to be filled after deployment)
export const CONTRACT_ADDRESSES = {
  testnet: {
    savingsVault: '', // Testnet contract address - to be filled
    bitcoinSavings: '', // Testnet contract address - to be filled
  },
  mainnet: {
    savingsVault: 'SP31PKQVQZVZCK3FM3NH67CGD6G1FMR17VQVS2W5T.bithodl-vault', // Mainnet contract address
    bitcoinSavings: 'SP31PKQVQZVZCK3FM3NH67CGD6G1FMR17VQVS2W5T.bithodl', // Mainnet contract address
  },
} as const;

/**
 * Get the current contract address based on the network
 * @param network - The current network ('testnet' | 'mainnet')
 * @param contractName - The contract name ('savingsVault' | 'bitcoinSavings')
 * @returns The contract address for the specified network and contract
 */
export const getContractAddress = (
  network: 'testnet' | 'mainnet',
  contractName: 'savingsVault' | 'bitcoinSavings'
): string => {
  return CONTRACT_ADDRESSES[network][contractName];
};

/**
 * Get all contract addresses for a specific network
 * @param network - The current network ('testnet' | 'mainnet')
 * @returns Object with all contract addresses for the specified network
 */
export const getNetworkContracts = (network: 'testnet' | 'mainnet') => {
  return CONTRACT_ADDRESSES[network];
};

/**
 * Check if contract addresses are configured for a network
 * @param network - The network to check ('testnet' | 'mainnet')
 * @returns True if all contract addresses are configured, false otherwise
 */
export const areContractsConfigured = (network: 'testnet' | 'mainnet'): boolean => {
  const contracts = CONTRACT_ADDRESSES[network];
  return Object.values(contracts).every(address => address !== '');
};