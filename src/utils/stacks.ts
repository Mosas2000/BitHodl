import { StacksNetworkConfig } from '@/types';
import { createNetwork } from '@stacks/network';

export const STACKS_NETWORKS: Record<'mainnet' | 'testnet', StacksNetworkConfig> = {
  mainnet: {
    network: 'mainnet',
    coreApiUrl: 'https://api.hiro.so',
    broadcastApiUrl: 'https://api.hiro.so',
  },
  testnet: {
    network: 'testnet',
    coreApiUrl: 'https://api.testnet.hiro.so',
    broadcastApiUrl: 'https://api.testnet.hiro.so',
  },
};

export const CONTRACT_ADDRESS = {
  mainnet: 'SP31PKQVQZVZCK3FM3NH67CGD6G1FMR17VQVS2W5T.bithodl',
  testnet: 'YOUR_TESTNET_CONTRACT_ADDRESS',
};

export const CONTRACT_NAME = 'bitcoin-savings';

/**
 * Gets the network configuration for the specified Stacks network
 * @param network - The Stacks network to get configuration for ('mainnet' or 'testnet')
 * @returns The network configuration object with API URLs
 */
export function getNetworkConfig(network: 'mainnet' | 'testnet' = 'mainnet'): StacksNetworkConfig {
  return STACKS_NETWORKS[network];
}

/**
 * Creates a Stacks network object for use with Stacks Connect v7
 * @param network - The Stacks network to create a network object for ('mainnet' or 'testnet')
 * @returns A configured Stacks network object
 */
export function getStacksNetwork(network: 'mainnet' | 'testnet' = 'mainnet') {
  const config = getNetworkConfig(network);

  // Stacks Connect v7 expects the `@stacks/network` network shape.
  // Use our configured Hiro API baseUrl.
  return createNetwork({
    network,
    client: {
      baseUrl: config.coreApiUrl,
    },
  });
}

/**
 * Gets the contract address for the specified network
 * @param network - The Stacks network to get the contract address for ('mainnet' or 'testnet')
 * @returns The contract address as a string
 */
export function getContractAddress(network: 'mainnet' | 'testnet' = 'mainnet'): string {
  return CONTRACT_ADDRESS[network];
}

/**
 * Converts microSTX to STX (1 STX = 1,000,000 microSTX)
 * @param microSTX - The amount in microSTX
 * @returns The equivalent amount in STX
 */
export function microSTXToSTX(microSTX: number): number {
  return microSTX / 1000000;
}

/**
 * Converts STX to microSTX (1 STX = 1,000,000 microSTX)
 * @param stx - The amount in STX
 * @returns The equivalent amount in microSTX
 */
export function stxToMicroSTX(stx: number): number {
  return Math.floor(stx * 1000000);
}

/**
 * Formats a STX amount with specified decimal places
 * @param amount - The STX amount to format
 * @param decimals - The number of decimal places to display (default: 6)
 * @returns The formatted STX amount as a string
 */
export function formatSTX(amount: number, decimals: number = 6): string {
  return amount.toFixed(decimals);
}

/**
 * Formats a Stacks address by truncating it for display
 * @param address - The full Stacks address to format
 * @param chars - The number of characters to show at the beginning and end (default: 6)
 * @returns The truncated address string
 */
export function formatAddress(address: string, chars: number = 6): string {
  if (!address) return '';
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Validates if a string represents a valid STX amount
 * @param amount - The amount string to validate
 * @returns True if the amount is valid, false otherwise
 */
export function validateSTXAmount(amount: string): boolean {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && num <= 1000000000; // Max 1B STX
}
