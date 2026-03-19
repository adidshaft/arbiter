import crypto from 'node:crypto'

import { Interface, JsonRpcProvider } from 'ethers'
import WDK from '@tetherto/wdk'
import WalletManagerBtc from '@tetherto/wdk-wallet-btc'
import WalletManagerEvm from '@tetherto/wdk-wallet-evm'
import WalletManagerSolana from '@tetherto/wdk-wallet-solana'
import WalletManagerTon from '@tetherto/wdk-wallet-ton'
import Usdt0ProtocolEvm from '@tetherto/wdk-protocol-bridge-usdt0-evm'

import { decryptSeedPhrase, encryptSeedPhrase } from './encryption.js'
import {
  bridgeUsdt as mockBridgeUsdt,
  createWallet as mockCreateWallet,
  getAddress as mockGetAddress,
  getAllWallets as mockGetAllWallets,
  getNativeBalance as mockGetNativeBalance,
  getUsdtBalance as mockGetUsdtBalance,
  setWalletState as mockSetWalletState,
  transferUsdt as mockTransferUsdt,
  type MockChainKey,
} from './mock.js'
import { getWalletChainConfig, getUsdtAddressForWalletChain, type WalletNetworkKey } from '../../network.js'

export type WalletChainKey = WalletNetworkKey & MockChainKey

export const ALL_WALLET_CHAINS = ['ethereum', 'polygon', 'arbitrum', 'solana', 'ton', 'bitcoin'] as const
export const EVM_WALLET_CHAINS = ['ethereum', 'polygon', 'arbitrum'] as const

const USDT_TRANSFER_INTERFACE = new Interface(['function transfer(address to, uint256 amount) returns (bool)'])
const USDT_BALANCE_INTERFACE = new Interface(['function balanceOf(address account) view returns (uint256)'])
const REAL_WDK_CACHE = new Map<string, RealWalletRuntime>()
const EVM_PROVIDER_CACHE = new Map<string, JsonRpcProvider>()

const DEFAULT_TRANSFER_MAX_FEE = 100_000_000_000_000n
const DEFAULT_BRIDGE_MAX_FEE = 100_000_000_000_000n

export interface WalletRecord {
  chainKey: WalletChainKey
  address: string
}

export interface AgentWalletProvisionInput {
  agentId: string
  seedPhrase?: string
  encryptedSeed?: string
  chainKeys?: readonly WalletChainKey[]
  index?: number
}

export interface AgentWalletProvisionResult {
  agentId: string
  encryptedSeed: string
  wallets: WalletRecord[]
  mode: 'mock' | 'real'
}

export interface WalletAddressInput {
  encryptedSeed?: string
  seedPhrase?: string
  chainKey: WalletChainKey
  index?: number
}

export interface WalletBalanceInput extends WalletAddressInput {}

export interface WalletNativeBalanceInput extends WalletAddressInput {}

export interface WalletTransferInput extends WalletAddressInput {
  recipient: string
  amountRaw: bigint
}

export interface WalletBridgeInput extends WalletAddressInput {
  targetChainKey: WalletChainKey
  recipient: string
  amountRaw: bigint
}

export interface WalletTransferReceipt {
  chainKey: WalletChainKey
  hash: string
  fee: bigint
}

export interface WalletBridgeReceipt {
  chainKey: WalletChainKey
  targetChainKey: WalletChainKey
  hash: string
  fee: bigint
  bridgeFee?: bigint
}

export interface WalletStatePatchInput extends WalletAddressInput {
  usdtRaw?: bigint
  nativeRaw?: bigint
}

interface RealWalletRuntime {
  seedPhrase: string
  wdk: RealWdkInstance
}

interface RealWdkInstance {
  registerWallet(
    chainKey: string,
    walletManager: unknown,
    config: Record<string, unknown>,
  ): RealWdkInstance
  getAccount(chainKey: string, index?: number): Promise<RealWalletAccount>
}

interface RealWalletAccount {
  getAddress(): Promise<string>
  getTokenBalance?(tokenAddress: string): Promise<bigint>
  getBalance?(): Promise<bigint>
  sendTransaction(tx: RealSendTransactionRequest): Promise<RealSendTransactionReceipt>
  getBridgeProtocol?(label: string): RealBridgeProtocol
}

interface RealSendTransactionRequest {
  to: string
  value: bigint
  data?: string
  gasLimit?: bigint | number
  gasPrice?: bigint | number
  maxFeePerGas?: bigint | number
  maxPriorityFeePerGas?: bigint | number
}

interface RealSendTransactionReceipt {
  hash: string
  fee: bigint
}

interface RealBridgeProtocol {
  bridge(options: {
    targetChain: string
    recipient: string
    token: string
    amount: bigint
  }): Promise<{ hash: string; fee: bigint; bridgeFee?: bigint }>
}

function isMockModeEnabled(): boolean {
  if (process.env.NODE_ENV === 'test') {
    return true
  }

  const value = process.env.USE_MOCK_APIS?.trim().toLowerCase()
  return value !== 'false' && value !== '0'
}

interface WalletSecretInput {
  encryptedSeed?: string
  seedPhrase?: string
}

function readSeedPhrase(source: WalletSecretInput): string {
  if (source.seedPhrase && source.seedPhrase.trim().length > 0) {
    return source.seedPhrase.trim().replace(/\s+/g, ' ')
  }

  if (source.encryptedSeed && source.encryptedSeed.trim().length > 0) {
    return decryptSeedPhrase(source.encryptedSeed.trim())
  }

  throw new Error('A seed phrase or encrypted seed is required')
}

function readEncryptionSeed(seedPhrase: string): string {
  return encryptSeedPhrase(seedPhrase)
}

function supportedChainsForProvision(chainKeys?: readonly WalletChainKey[]): readonly WalletChainKey[] {
  if (chainKeys && chainKeys.length > 0) {
    return chainKeys
  }

  return ALL_WALLET_CHAINS
}

function isEvmChain(chainKey: WalletChainKey): boolean {
  return chainKey === 'ethereum' || chainKey === 'polygon' || chainKey === 'arbitrum'
}

function getEvmProvider(chainKey: WalletChainKey): JsonRpcProvider {
  if (!isEvmChain(chainKey)) {
    throw new Error(`EVM provider requested for non-EVM chain ${chainKey}`)
  }

  const config = getWalletChainConfig(chainKey)
  const rpcUrl = config.rpcUrl
  if (!rpcUrl) {
    throw new Error(`Missing RPC URL for chain ${chainKey}`)
  }

  const cacheKey = `${chainKey}:${rpcUrl}`
  const cachedProvider = EVM_PROVIDER_CACHE.get(cacheKey)
  if (cachedProvider) {
    return cachedProvider
  }

  const provider = new JsonRpcProvider(rpcUrl)
  EVM_PROVIDER_CACHE.set(cacheKey, provider)
  return provider
}

function readRealRuntime(seedPhrase: string): RealWalletRuntime {
  const cachedRuntime = REAL_WDK_CACHE.get(seedPhrase)
  if (cachedRuntime) {
    return cachedRuntime
  }

  const runtime = buildRealRuntime(seedPhrase)
  REAL_WDK_CACHE.set(seedPhrase, runtime)
  return runtime
}

function buildRealRuntime(seedPhrase: string): RealWalletRuntime {
  const wdk = new WDK(seedPhrase) as unknown as RealWdkInstance

  wdk.registerWallet('ethereum', WalletManagerEvm, {
    provider: getWalletChainConfig('ethereum').rpcUrl,
    transferMaxFee: DEFAULT_TRANSFER_MAX_FEE,
  })
  wdk.registerWallet('polygon', WalletManagerEvm, {
    provider: getWalletChainConfig('polygon').rpcUrl,
    transferMaxFee: DEFAULT_TRANSFER_MAX_FEE,
  })
  wdk.registerWallet('arbitrum', WalletManagerEvm, {
    provider: getWalletChainConfig('arbitrum').rpcUrl,
    transferMaxFee: DEFAULT_TRANSFER_MAX_FEE,
  })
  wdk.registerWallet('solana', WalletManagerSolana, {
    rpcUrl: getWalletChainConfig('solana').rpcUrl,
  })
  wdk.registerWallet('ton', WalletManagerTon, {
    endpoint: getWalletChainConfig('ton').rpcUrl,
  })
  const bitcoinConfig = getWalletChainConfig('bitcoin')
  wdk.registerWallet('bitcoin', WalletManagerBtc, {
    network: bitcoinConfig.bitcoinNetwork ?? 'mainnet',
    host: bitcoinConfig.bitcoinHost ?? 'electrum.blockstream.info',
    port: bitcoinConfig.bitcoinPort ?? 50001,
  })

  return { seedPhrase, wdk }
}

async function getRealAccount(runtime: RealWalletRuntime, chainKey: WalletChainKey, index: number): Promise<RealWalletAccount> {
  return runtime.wdk.getAccount(chainKey, index)
}

async function getRealAccountAddress(runtime: RealWalletRuntime, chainKey: WalletChainKey, index: number): Promise<string> {
  const account = await getRealAccount(runtime, chainKey, index)
  return account.getAddress()
}

async function getRealUsdtBalance(runtime: RealWalletRuntime, chainKey: WalletChainKey, index: number): Promise<bigint> {
  const usdtAddress = getUsdtAddress(chainKey)
  if (!usdtAddress) {
    return 0n
  }

  if (isEvmChain(chainKey)) {
    const address = await getRealAccountAddress(runtime, chainKey, index)
    const provider = getEvmProvider(chainKey)
    const result = await provider.call({
      to: usdtAddress,
      data: USDT_BALANCE_INTERFACE.encodeFunctionData('balanceOf', [address])
    })
    const [balance] = USDT_BALANCE_INTERFACE.decodeFunctionResult('balanceOf', result)
    return BigInt(balance.toString())
  }

  const account = await getRealAccount(runtime, chainKey, index)
  if (account.getTokenBalance) {
    return account.getTokenBalance(usdtAddress)
  }

  return 0n
}

function getUsdtAddress(chainKey: WalletChainKey): string | null {
  return getUsdtAddressForWalletChain(chainKey)
}

async function getRealNativeBalance(runtime: RealWalletRuntime, chainKey: WalletChainKey, index: number): Promise<bigint> {
  if (isEvmChain(chainKey)) {
    const address = await getRealAccountAddress(runtime, chainKey, index)
    const provider = getEvmProvider(chainKey)
    return provider.getBalance(address)
  }

  const account = await getRealAccount(runtime, chainKey, index)
  if (account.getBalance) {
    return account.getBalance()
  }

  return 0n
}

export function generateAgentSeedPhrase(): string {
  const wdkStatics = WDK as unknown as { getRandomSeedPhrase?: (length?: number) => string }
  if (typeof wdkStatics.getRandomSeedPhrase === 'function') {
    try {
      return wdkStatics.getRandomSeedPhrase(24)
    } catch {
      return wdkStatics.getRandomSeedPhrase()
    }
  }

  return crypto.randomBytes(32).toString('hex')
}

export async function createAgentWallet(input: AgentWalletProvisionInput): Promise<AgentWalletProvisionResult> {
  const seedPhrase = readSeedPhrase(input)
  const encryptedSeed = input.encryptedSeed && input.encryptedSeed.trim().length > 0
    ? input.encryptedSeed.trim()
    : readEncryptionSeed(seedPhrase)
  const chainKeys = supportedChainsForProvision(input.chainKeys)
  const index = input.index ?? 0

  if (isMockModeEnabled()) {
    const wallets = await mockCreateWallet({ seedPhrase, chainKeys, index })
    return {
      agentId: input.agentId,
      encryptedSeed,
      wallets: wallets.map((wallet: { chainKey: WalletChainKey; address: string }) => ({
        chainKey: wallet.chainKey,
        address: wallet.address,
      })),
      mode: 'mock',
    }
  }

  const runtime = readRealRuntime(seedPhrase)
  const wallets: WalletRecord[] = []
  for (const chainKey of chainKeys) {
    const address = await getRealAccountAddress(runtime, chainKey, index)
    wallets.push({ chainKey, address })
  }

  return {
    agentId: input.agentId,
    encryptedSeed,
    wallets,
    mode: 'real',
  }
}

export async function getWalletAddress(input: WalletAddressInput): Promise<string> {
  const seedPhrase = readSeedPhrase(input)
  const index = input.index ?? 0

  if (isMockModeEnabled()) {
    return mockGetAddress({ seedPhrase, chainKey: input.chainKey, index })
  }

  const runtime = readRealRuntime(seedPhrase)
  return getRealAccountAddress(runtime, input.chainKey, index)
}

export async function getUsdtBalance(input: WalletBalanceInput): Promise<bigint> {
  const seedPhrase = readSeedPhrase(input)
  const index = input.index ?? 0

  if (isMockModeEnabled()) {
    return mockGetUsdtBalance({ seedPhrase, chainKey: input.chainKey, index })
  }

  const runtime = readRealRuntime(seedPhrase)
  return getRealUsdtBalance(runtime, input.chainKey, index)
}

export async function getNativeBalance(input: WalletNativeBalanceInput): Promise<bigint> {
  const seedPhrase = readSeedPhrase(input)
  const index = input.index ?? 0

  if (isMockModeEnabled()) {
    return mockGetNativeBalance({ seedPhrase, chainKey: input.chainKey, index })
  }

  const runtime = readRealRuntime(seedPhrase)
  return getRealNativeBalance(runtime, input.chainKey, index)
}

export async function transferUsdt(input: WalletTransferInput): Promise<WalletTransferReceipt> {
  const seedPhrase = readSeedPhrase(input)
  const index = input.index ?? 0

  if (isMockModeEnabled()) {
    const receipt = await mockTransferUsdt({
      seedPhrase,
      chainKey: input.chainKey,
      index,
      recipient: input.recipient,
      amountRaw: input.amountRaw,
    })

    return {
      chainKey: input.chainKey,
      hash: receipt.hash,
      fee: receipt.fee,
    }
  }

  if (!isEvmChain(input.chainKey)) {
    throw new Error('USDT ERC-20 transfers are only supported on EVM chains')
  }

  const runtime = readRealRuntime(seedPhrase)
  const account = await getRealAccount(runtime, input.chainKey, index)
  const tokenAddress = getUsdtAddress(input.chainKey)
  if (!tokenAddress) {
    throw new Error('Missing USDT contract address for chain')
  }

  const data = USDT_TRANSFER_INTERFACE.encodeFunctionData('transfer', [input.recipient, input.amountRaw])
  const receipt = await account.sendTransaction({
    to: tokenAddress,
    value: 0n,
    data,
  })

  await getEvmProvider(input.chainKey).waitForTransaction(receipt.hash)

  return {
    chainKey: input.chainKey,
    hash: receipt.hash,
    fee: receipt.fee,
  }
}

export async function bridgeUsdtCrossChain(input: WalletBridgeInput): Promise<WalletBridgeReceipt> {
  const seedPhrase = readSeedPhrase(input)
  const index = input.index ?? 0

  if (!isEvmChain(input.chainKey)) {
    throw new Error('Cross-chain bridging requires an EVM source chain')
  }

  if (isMockModeEnabled()) {
    const receipt = await mockBridgeUsdt({
      seedPhrase,
      chainKey: input.chainKey,
      index,
      targetChainKey: input.targetChainKey,
      recipient: input.recipient,
      amountRaw: input.amountRaw,
    })

    return {
      chainKey: input.chainKey,
      targetChainKey: input.targetChainKey,
      hash: receipt.hash,
      fee: receipt.fee,
      bridgeFee: receipt.bridgeFee,
    }
  }

  const runtime = readRealRuntime(seedPhrase)
  const account = await getRealAccount(runtime, input.chainKey, index)
  const tokenAddress = getUsdtAddress(input.chainKey)
  if (!tokenAddress) {
    throw new Error('Missing USDT contract address for chain')
  }

  const BridgeProtocol = Usdt0ProtocolEvm as unknown as new (
    account: unknown,
    config: { bridgeMaxFee: bigint }
  ) => RealBridgeProtocol
  const bridge = new BridgeProtocol(account, { bridgeMaxFee: DEFAULT_BRIDGE_MAX_FEE })

  const receipt = await bridge.bridge({
    targetChain: input.targetChainKey,
    recipient: input.recipient,
    token: tokenAddress,
    amount: input.amountRaw,
  })

  return {
    chainKey: input.chainKey,
    targetChainKey: input.targetChainKey,
    hash: receipt.hash,
    fee: receipt.fee,
    bridgeFee: receipt.bridgeFee,
  }
}

export async function getAllWalletAddresses(input: { encryptedSeed?: string; seedPhrase?: string; index?: number }): Promise<WalletRecord[]> {
  const seedPhrase = readSeedPhrase(input)
  const index = input.index ?? 0

  if (isMockModeEnabled()) {
    const wallets = await mockGetAllWallets({ seedPhrase })
    return wallets.map((wallet: { chainKey: WalletChainKey; address: string }) => ({
      chainKey: wallet.chainKey,
      address: wallet.address,
    }))
  }

  const runtime = readRealRuntime(seedPhrase)
  const wallets: WalletRecord[] = []
  for (const chainKey of ALL_WALLET_CHAINS) {
    wallets.push({
      chainKey,
      address: await getRealAccountAddress(runtime, chainKey, index),
    })
  }

  return wallets
}

export async function setMockWalletState(input: WalletStatePatchInput): Promise<void> {
  if (!isMockModeEnabled()) {
    throw new Error('Mock wallet state can only be adjusted in mock mode')
  }

  const seedPhrase = readSeedPhrase(input)
  await mockSetWalletState({
    seedPhrase,
    chainKey: input.chainKey,
    index: input.index ?? 0,
    usdtRaw: input.usdtRaw,
    nativeRaw: input.nativeRaw
  })
}
