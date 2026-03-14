import { SUPPORTED_CHAINS, type AgentConfig, type ChainKey } from '@arbiter/core'
import type { WalletChainKey } from './services/wdk/walletService.js'

export const CORE_TO_WALLET_CHAIN: Record<ChainKey, WalletChainKey> = {
  ETHEREUM: 'ethereum',
  POLYGON: 'polygon',
  ARBITRUM: 'arbitrum',
  SOLANA: 'solana',
  TON: 'ton',
  BITCOIN: 'bitcoin'
}

export const WALLET_TO_CORE_CHAIN: Record<WalletChainKey, ChainKey> = {
  ethereum: 'ETHEREUM',
  polygon: 'POLYGON',
  arbitrum: 'ARBITRUM',
  solana: 'SOLANA',
  ton: 'TON',
  bitcoin: 'BITCOIN'
}

export const ALL_CHAIN_KEYS = Object.keys(SUPPORTED_CHAINS) as ChainKey[]

export function toWalletChain(chainKey: ChainKey): WalletChainKey {
  return CORE_TO_WALLET_CHAIN[chainKey]
}

export function toCoreChain(chainKey: WalletChainKey): ChainKey {
  const mapped = WALLET_TO_CORE_CHAIN[chainKey]
  if (!mapped) {
    throw new Error(`Unsupported wallet chain: ${chainKey}`)
  }
  return mapped
}

export function isEvmChain(chainKey: ChainKey): boolean {
  return SUPPORTED_CHAINS[chainKey].isEvm
}

export function formatUsdtHuman(value: bigint, chainKey: ChainKey): string {
  const decimals = SUPPORTED_CHAINS[chainKey].usdtDecimals
  const divisor = 10n ** BigInt(decimals)
  const whole = value / divisor
  const fraction = value % divisor
  if (fraction === 0n) {
    return whole.toString()
  }

  return `${whole.toString()}.${fraction.toString().padStart(decimals, '0').replace(/0+$/, '')}`
}

export function usdtRawToNumber(value: bigint, chainKey: ChainKey): number {
  const decimals = SUPPORTED_CHAINS[chainKey].usdtDecimals
  return Number(value) / 10 ** decimals
}

export function usdtNumberToRaw(value: number, chainKey: ChainKey): bigint {
  const decimals = SUPPORTED_CHAINS[chainKey].usdtDecimals
  return BigInt(Math.round(value * 10 ** decimals))
}

export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  maxTransactionSize: 250,
  dailySpendingCap: 1000,
  lendingOptIn: false,
  minBalanceFloor: 25,
  preferredChains: ['POLYGON', 'ARBITRUM'],
  allowedContracts: [],
  blockedContracts: []
}
