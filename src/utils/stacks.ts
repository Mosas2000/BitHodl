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

export function getNetworkConfig(network: 'mainnet' | 'testnet' = 'mainnet'): StacksNetworkConfig {
  return STACKS_NETWORKS[network];
}

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

export function stxToMicroSTX(stx: number): number {
  return Math.floor(stx * 1000000);
}

export function formatSTX(amount: number, decimals: number = 6): string {
  return amount.toFixed(decimals);
}

export function formatAddress(address: string, chars: number = 6): string {
  if (!address) return '';
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function validateSTXAmount(amount: string): boolean {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && num <= 1000000000; // Max 1B STX
}
