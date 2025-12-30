export const CONTRACT_ADDRESSES = {
  testnet: {
    savingsVault: '', // Testnet contract address - to be filled
    bitcoinSavings: '', // Testnet contract address - to be filled
  },
  mainnet: {
    savingsVault: 'SP31PKQVQZVZCK3FM3NH67CGD6G1FMR17VQVS2W5T.bithodl-vault',
    bitcoinSavings: 'SP31PKQVQZVZCK3FM3NH67CGD6G1FMR17VQVS2W5T.bithodl', 
  },
} as const;


export const getContractAddress = (
  network: 'testnet' | 'mainnet',
  contractName: 'savingsVault' | 'bitcoinSavings'
): string => {
  return CONTRACT_ADDRESSES[network][contractName];
};


export const getNetworkContracts = (network: 'testnet' | 'mainnet') => {
  return CONTRACT_ADDRESSES[network];
};

export const areContractsConfigured = (network: 'testnet' | 'mainnet'): boolean => {
  const contracts = CONTRACT_ADDRESSES[network];
  return Object.values(contracts).every(address => address !== '');
};