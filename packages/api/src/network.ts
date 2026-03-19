import type { ChainKey, NetworkMode } from '@arbiter/core'

export type WalletNetworkKey = 'ethereum' | 'polygon' | 'arbitrum' | 'solana' | 'ton' | 'bitcoin'

export interface ChainRuntimeConfig {
  id: number
  name: string
  symbol: string
  walletKey: WalletNetworkKey
  rpcEnvVar: string | null
  rpcUrl: string | null
  usdtAddress: string | null
  usdtDecimals: number
  explorerTxTemplate: string
  isEvm: boolean
  nativeDecimals: number
  bitcoinNetwork?: 'mainnet' | 'testnet'
  bitcoinHost?: string
  bitcoinPort?: number
}

export const CORE_TO_WALLET_CHAIN: Record<ChainKey, WalletNetworkKey> = {
  ETHEREUM: 'ethereum',
  POLYGON: 'polygon',
  ARBITRUM: 'arbitrum',
  SOLANA: 'solana',
  TON: 'ton',
  BITCOIN: 'bitcoin'
}

export const WALLET_TO_CORE_CHAIN: Record<WalletNetworkKey, ChainKey> = {
  ethereum: 'ETHEREUM',
  polygon: 'POLYGON',
  arbitrum: 'ARBITRUM',
  solana: 'SOLANA',
  ton: 'TON',
  bitcoin: 'BITCOIN'
}

const MAINNET_CHAIN_CONFIG: Record<ChainKey, ChainRuntimeConfig> = {
  ETHEREUM: {
    id: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    walletKey: 'ethereum',
    rpcEnvVar: 'ETH_RPC_URL',
    rpcUrl: process.env.ETH_RPC_URL ?? 'https://eth.drpc.org',
    usdtAddress: process.env.ETH_USDT_ADDRESS ?? '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    usdtDecimals: 6,
    explorerTxTemplate: 'https://etherscan.io/tx/{hash}',
    isEvm: true,
    nativeDecimals: 18
  },
  POLYGON: {
    id: 137,
    name: 'Polygon',
    symbol: 'MATIC',
    walletKey: 'polygon',
    rpcEnvVar: 'POLYGON_RPC_URL',
    rpcUrl: process.env.POLYGON_RPC_URL ?? 'https://polygon-rpc.com',
    usdtAddress: process.env.POLYGON_USDT_ADDRESS ?? '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    usdtDecimals: 6,
    explorerTxTemplate: 'https://polygonscan.com/tx/{hash}',
    isEvm: true,
    nativeDecimals: 18
  },
  ARBITRUM: {
    id: 42161,
    name: 'Arbitrum',
    symbol: 'ETH',
    walletKey: 'arbitrum',
    rpcEnvVar: 'ARBITRUM_RPC_URL',
    rpcUrl: process.env.ARBITRUM_RPC_URL ?? 'https://arb1.arbitrum.io/rpc',
    usdtAddress: process.env.ARBITRUM_USDT_ADDRESS ?? '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    usdtDecimals: 6,
    explorerTxTemplate: 'https://arbiscan.io/tx/{hash}',
    isEvm: true,
    nativeDecimals: 18
  },
  SOLANA: {
    id: 900,
    name: 'Solana',
    symbol: 'SOL',
    walletKey: 'solana',
    rpcEnvVar: 'SOLANA_RPC_URL',
    rpcUrl: process.env.SOLANA_RPC_URL ?? 'https://api.mainnet-beta.solana.com',
    usdtAddress: process.env.SOLANA_USDT_ADDRESS ?? 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    usdtDecimals: 6,
    explorerTxTemplate: 'https://solscan.io/tx/{hash}',
    isEvm: false,
    nativeDecimals: 9
  },
  TON: {
    id: 1100,
    name: 'TON',
    symbol: 'TON',
    walletKey: 'ton',
    rpcEnvVar: 'TON_RPC_URL',
    rpcUrl: process.env.TON_RPC_URL ?? 'https://toncenter.com/api/v2/jsonRPC',
    usdtAddress: process.env.TON_USDT_ADDRESS ?? 'EQCajaUU1XXSAjTD-xOV7pE49fGtg4q8kF3ELCOxj5Rq_eYZ',
    usdtDecimals: 6,
    explorerTxTemplate: 'https://tonscan.org/tx/{hash}',
    isEvm: false,
    nativeDecimals: 9
  },
  BITCOIN: {
    id: 0,
    name: 'Bitcoin',
    symbol: 'BTC',
    walletKey: 'bitcoin',
    rpcEnvVar: null,
    rpcUrl: null,
    usdtAddress: null,
    usdtDecimals: 8,
    explorerTxTemplate: 'https://blockstream.info/tx/{hash}',
    isEvm: false,
    nativeDecimals: 8,
    bitcoinNetwork: 'mainnet',
    bitcoinHost: process.env.BITCOIN_MAINNET_ELECTRUM_HOST ?? 'electrum.blockstream.info',
    bitcoinPort: Number(process.env.BITCOIN_MAINNET_ELECTRUM_PORT ?? '50001')
  }
}

const TESTNET_CHAIN_CONFIG: Record<ChainKey, ChainRuntimeConfig> = {
  ETHEREUM: {
    id: 11155111,
    name: 'Ethereum Sepolia',
    symbol: 'ETH',
    walletKey: 'ethereum',
    rpcEnvVar: 'ETH_SEPOLIA_RPC_URL',
    rpcUrl: process.env.ETH_SEPOLIA_RPC_URL ?? 'https://sepolia.drpc.org',
    usdtAddress: process.env.ETH_SEPOLIA_USDT_ADDRESS ?? '0xd077a400968890eacc75cdc901f0356c943e4fdb',
    usdtDecimals: 6,
    explorerTxTemplate: 'https://sepolia.etherscan.io/tx/{hash}',
    isEvm: true,
    nativeDecimals: 18
  },
  POLYGON: {
    id: 80002,
    name: 'Polygon Amoy',
    symbol: 'POL',
    walletKey: 'polygon',
    rpcEnvVar: 'POLYGON_AMOY_RPC_URL',
    rpcUrl: process.env.POLYGON_AMOY_RPC_URL ?? 'https://rpc-amoy.polygon.technology',
    usdtAddress: blankToNull(process.env.POLYGON_AMOY_USDT_ADDRESS) ?? null,
    usdtDecimals: 6,
    explorerTxTemplate: 'https://amoy.polygonscan.com/tx/{hash}',
    isEvm: true,
    nativeDecimals: 18
  },
  ARBITRUM: {
    id: 421614,
    name: 'Arbitrum Sepolia',
    symbol: 'ETH',
    walletKey: 'arbitrum',
    rpcEnvVar: 'ARBITRUM_SEPOLIA_RPC_URL',
    rpcUrl: process.env.ARBITRUM_SEPOLIA_RPC_URL ?? 'https://sepolia-rollup.arbitrum.io/rpc',
    usdtAddress: blankToNull(process.env.ARBITRUM_SEPOLIA_USDT_ADDRESS) ?? null,
    usdtDecimals: 6,
    explorerTxTemplate: 'https://sepolia.arbiscan.io/tx/{hash}',
    isEvm: true,
    nativeDecimals: 18
  },
  SOLANA: {
    id: 901,
    name: 'Solana Devnet',
    symbol: 'SOL',
    walletKey: 'solana',
    rpcEnvVar: 'SOLANA_DEVNET_RPC_URL',
    rpcUrl: process.env.SOLANA_DEVNET_RPC_URL ?? 'https://api.devnet.solana.com',
    usdtAddress: blankToNull(process.env.SOLANA_DEVNET_USDT_ADDRESS) ?? null,
    usdtDecimals: 6,
    explorerTxTemplate: 'https://explorer.solana.com/tx/{hash}?cluster=devnet',
    isEvm: false,
    nativeDecimals: 9
  },
  TON: {
    id: 1101,
    name: 'TON Testnet',
    symbol: 'TON',
    walletKey: 'ton',
    rpcEnvVar: 'TON_TESTNET_RPC_URL',
    rpcUrl: process.env.TON_TESTNET_RPC_URL ?? 'https://testnet.toncenter.com/api/v2/jsonRPC',
    usdtAddress: blankToNull(process.env.TON_TESTNET_USDT_ADDRESS) ?? null,
    usdtDecimals: 6,
    explorerTxTemplate: 'https://testnet.tonviewer.com/transaction/{hash}',
    isEvm: false,
    nativeDecimals: 9
  },
  BITCOIN: {
    id: 1,
    name: 'Bitcoin Testnet',
    symbol: 'BTC',
    walletKey: 'bitcoin',
    rpcEnvVar: null,
    rpcUrl: null,
    usdtAddress: null,
    usdtDecimals: 8,
    explorerTxTemplate: 'https://blockstream.info/testnet/tx/{hash}',
    isEvm: false,
    nativeDecimals: 8,
    bitcoinNetwork: 'testnet',
    bitcoinHost: process.env.BITCOIN_TESTNET_ELECTRUM_HOST ?? 'electrum.blockstream.info',
    bitcoinPort: Number(process.env.BITCOIN_TESTNET_ELECTRUM_PORT ?? '60001')
  }
}

function blankToNull(value: string | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export function readNetworkMode(): NetworkMode {
  const rawValue = process.env.NETWORK_MODE?.trim().toLowerCase()
  return rawValue === 'testnet' ? 'testnet' : 'mainnet'
}

export function getActiveChainConfig(): Record<ChainKey, ChainRuntimeConfig> {
  return readNetworkMode() === 'testnet' ? TESTNET_CHAIN_CONFIG : MAINNET_CHAIN_CONFIG
}

export function getChainConfig(chainKey: ChainKey): ChainRuntimeConfig {
  return getActiveChainConfig()[chainKey]
}

export function getWalletChainConfig(chainKey: WalletNetworkKey): ChainRuntimeConfig {
  return getChainConfig(WALLET_TO_CORE_CHAIN[chainKey])
}

export function getUsdtAddressForWalletChain(chainKey: WalletNetworkKey): string | null {
  return getWalletChainConfig(chainKey).usdtAddress
}

export function getExplorerUrl(chainKey: ChainKey, txHash: string): string {
  return getChainConfig(chainKey).explorerTxTemplate.replace('{hash}', txHash)
}

export function getNativeDecimals(chainKey: ChainKey): number {
  return getChainConfig(chainKey).nativeDecimals
}
