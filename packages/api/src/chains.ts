import { SUPPORTED_CHAINS, type AgentConfig, type ChainKey } from '@arbiter/core'
import { CORE_TO_WALLET_CHAIN, WALLET_TO_CORE_CHAIN, type WalletNetworkKey } from './network.js'

export type WalletChainKey = WalletNetworkKey

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

export function formatNativeHuman(value: bigint, chainKey: ChainKey): string {
  const decimalsByChain: Record<ChainKey, number> = {
    ETHEREUM: 18,
    POLYGON: 18,
    ARBITRUM: 18,
    SOLANA: 9,
    TON: 9,
    BITCOIN: 8
  }
  const decimals = decimalsByChain[chainKey]
  const divisor = 10n ** BigInt(decimals)
  const whole = value / divisor
  const fraction = value % divisor
  if (fraction === 0n) {
    return whole.toString()
  }

  return `${whole.toString()}.${fraction.toString().padStart(decimals, '0').replace(/0+$/, '')}`
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
