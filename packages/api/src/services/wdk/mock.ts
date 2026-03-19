import crypto from 'node:crypto'

export type MockChainKey =
  | 'ethereum'
  | 'polygon'
  | 'arbitrum'
  | 'solana'
  | 'ton'
  | 'bitcoin'

export interface MockWalletCreateInput {
  seedPhrase: string
  chainKeys?: readonly MockChainKey[]
  index?: number
}

export interface MockWalletLookupInput {
  seedPhrase: string
  chainKey: MockChainKey
  index?: number
}

export interface MockWalletTransferInput extends MockWalletLookupInput {
  recipient: string
  amountRaw: bigint
}

export interface MockWalletBridgeInput extends MockWalletLookupInput {
  targetChainKey: MockChainKey
  recipient: string
  amountRaw: bigint
}

export interface MockWalletRecord {
  key: string
  seedFingerprint: string
  chainKey: MockChainKey
  index: number
  address: string
  nativeRaw: bigint
  usdtRaw: bigint
  createdAt: Date
  updatedAt: Date
  lastTxHash?: string
  lastBridgeHash?: string
}

export interface MockTransferReceipt {
  hash: string
  fee: bigint
}

export interface MockBridgeReceipt extends MockTransferReceipt {
  bridgeFee: bigint
}

export interface MockWalletStatePatch {
  usdtRaw?: bigint
  nativeRaw?: bigint
}

const CHAIN_ORDER: readonly MockChainKey[] = [
  'ethereum',
  'polygon',
  'arbitrum',
  'solana',
  'ton',
  'bitcoin',
] as const

const EVM_CHAINS = new Set<MockChainKey>(['ethereum', 'polygon', 'arbitrum'])

const WALLET_REGISTRY = new Map<string, MockWalletRecord>()
const ADDRESS_INDEX = new Map<string, string>()

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const BASE32_ALPHABET = 'abcdefghijklmnopqrstuvwxyz234567'

function stableHash(...parts: readonly string[]): Buffer {
  return crypto.createHash('sha256').update(parts.join('|')).digest()
}

function seedFingerprint(seedPhrase: string): string {
  return stableHash(seedPhrase.trim().replace(/\s+/g, ' ')).toString('hex').slice(0, 32)
}

function encodeBase58(input: Uint8Array): string {
  const zeroes = input.findIndex((byte) => byte !== 0)
  const digits: number[] = [0]

  for (const byte of input) {
    let carry = byte
    for (let index = 0; index < digits.length; index += 1) {
      carry += (digits[index] ?? 0) << 8
      digits[index] = carry % 58
      carry = Math.floor(carry / 58)
    }
    while (carry > 0) {
      digits.push(carry % 58)
      carry = Math.floor(carry / 58)
    }
  }

  let prefix = ''
  for (let index = 0; index < zeroes; index += 1) {
    prefix += BASE58_ALPHABET[0]
  }

  return prefix + digits.reverse().map((digit) => BASE58_ALPHABET[digit] ?? BASE58_ALPHABET[0]).join('')
}

function encodeBase32(input: Uint8Array): string {
  let bits = 0
  let value = 0
  let output = ''

  for (const byte of input) {
    value = (value << 8) | byte
    bits += 8

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31] ?? BASE32_ALPHABET[0]
      bits -= 5
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31] ?? BASE32_ALPHABET[0]
  }

  return output
}

function randomLatencyMs(...parts: readonly string[]): number {
  const hash = stableHash(...parts)
  return 80 + ((hash.at(0) ?? 0) % 121)
}

function buildAddress(seed: string, chainKey: MockChainKey, index: number): string {
  const material = stableHash(seed, chainKey, String(index))

  if (chainKey === 'ethereum' || chainKey === 'polygon' || chainKey === 'arbitrum') {
    return `0x${material.toString('hex').slice(0, 40)}`
  }

  if (chainKey === 'solana') {
    return encodeBase58(material).slice(0, 44)
  }

  if (chainKey === 'ton') {
    const encoded = material.toString('base64url').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 48)
    return `EQ${encoded}`
  }

  const btcPart = encodeBase32(material).slice(0, 39)
  return `bc1q${btcPart}`
}

function buildTxHash(seed: string, chainKey: MockChainKey, operation: string, nonce: number): string {
  const material = stableHash(seed, chainKey, operation, String(nonce))

  if (chainKey === 'solana') {
    return encodeBase58(material).slice(0, 88)
  }

  if (chainKey === 'ton') {
    return material.toString('hex').padEnd(64, '0').slice(0, 64)
  }

  return `0x${material.toString('hex').slice(0, 64)}`
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function walletKey(seedPhrase: string, chainKey: MockChainKey, index: number): string {
  return `${seedFingerprint(seedPhrase)}:${chainKey}:${index}`
}

function readWallet(seedPhrase: string, chainKey: MockChainKey, index: number): MockWalletRecord | undefined {
  return WALLET_REGISTRY.get(walletKey(seedPhrase, chainKey, index))
}

function ensureWallet(seedPhrase: string, chainKey: MockChainKey, index: number): MockWalletRecord {
  return readWallet(seedPhrase, chainKey, index) ?? createOrGetWallet(seedPhrase, chainKey, index)
}

function createOrGetWallet(seedPhrase: string, chainKey: MockChainKey, index: number): MockWalletRecord {
  const key = walletKey(seedPhrase, chainKey, index)
  const existing = WALLET_REGISTRY.get(key)
  if (existing) {
    return existing
  }

  const fingerprint = seedFingerprint(seedPhrase)
  const address = buildAddress(seedPhrase, chainKey, index)
  const material = stableHash(fingerprint, chainKey, String(index), 'balances')
  const nativeRaw = BigInt(1_000_000_000_000_000_000) * BigInt(2 + ((material.at(0) ?? 0) % 11))
  // Keep raw token balances as bigint values end-to-end so Solana-sized token units
  // never round through number parsing in mock mode.
  const usdtScale = chainKey === 'bitcoin' ? 10_000_000n : 1_000_000n
  const usdtRaw = usdtScale * BigInt(25 + ((material.at(1) ?? 0) % 176))
  const now = new Date()
  const record: MockWalletRecord = {
    key,
    seedFingerprint: fingerprint,
    chainKey,
    index,
    address,
    nativeRaw,
    usdtRaw,
    createdAt: now,
    updatedAt: now,
  }

  WALLET_REGISTRY.set(key, record)
  ADDRESS_INDEX.set(address, key)
  return record
}

async function withLatency<T>(seedPhrase: string, chainKey: MockChainKey, operation: string, work: () => T): Promise<T> {
  const ms = randomLatencyMs(seedPhrase, chainKey, operation)
  await delay(ms)
  return work()
}

export async function createWallet(input: MockWalletCreateInput): Promise<MockWalletRecord[]> {
  const chainKeys = input.chainKeys?.length ? input.chainKeys : CHAIN_ORDER
  const index = input.index ?? 0

  return withLatency(input.seedPhrase, chainKeys[0] ?? 'ethereum', 'createWallet', () =>
    chainKeys.map((chainKey) => createOrGetWallet(input.seedPhrase, chainKey, index)),
  )
}

export async function getWallet(input: MockWalletLookupInput): Promise<MockWalletRecord> {
  return withLatency(input.seedPhrase, input.chainKey, 'getWallet', () => {
    return ensureWallet(input.seedPhrase, input.chainKey, input.index ?? 0)
  })
}

export async function getAllWallets(input: { seedPhrase: string }): Promise<MockWalletRecord[]> {
  return withLatency(input.seedPhrase, 'ethereum', 'getAllWallets', () =>
    CHAIN_ORDER
      .map((chainKey) => ensureWallet(input.seedPhrase, chainKey, 0))
      .sort((left, right) => CHAIN_ORDER.indexOf(left.chainKey) - CHAIN_ORDER.indexOf(right.chainKey)),
  )
}

export async function getAddress(input: MockWalletLookupInput): Promise<string> {
  return withLatency(input.seedPhrase, input.chainKey, 'getAddress', () =>
    ensureWallet(input.seedPhrase, input.chainKey, input.index ?? 0).address,
  )
}

export async function getUsdtBalance(input: MockWalletLookupInput): Promise<bigint> {
  return withLatency(input.seedPhrase, input.chainKey, 'getUsdtBalance', () =>
    ensureWallet(input.seedPhrase, input.chainKey, input.index ?? 0).usdtRaw,
  )
}

export async function getNativeBalance(input: MockWalletLookupInput): Promise<bigint> {
  return withLatency(input.seedPhrase, input.chainKey, 'getNativeBalance', () =>
    ensureWallet(input.seedPhrase, input.chainKey, input.index ?? 0).nativeRaw,
  )
}

export async function transferUsdt(input: MockWalletTransferInput): Promise<MockTransferReceipt> {
  return withLatency(input.seedPhrase, input.chainKey, 'transferUsdt', () => {
    const sender = createOrGetWallet(input.seedPhrase, input.chainKey, input.index ?? 0)
    if (sender.usdtRaw < input.amountRaw) {
      throw new Error('Insufficient mock USDT balance')
    }

    const recipientKey = ADDRESS_INDEX.get(input.recipient)
    const recipient = recipientKey ? WALLET_REGISTRY.get(recipientKey) : undefined

    sender.usdtRaw -= input.amountRaw
    sender.updatedAt = new Date()

    if (recipient && recipient.chainKey === input.chainKey) {
      recipient.usdtRaw += input.amountRaw
      recipient.updatedAt = new Date()
    }

    const nonce = sender.lastTxHash ? Number.parseInt(sender.lastTxHash.slice(-8), 16) + 1 : 1
    const hash = buildTxHash(input.seedPhrase, input.chainKey, 'transfer', nonce)
    sender.lastTxHash = hash

    return {
      hash,
      fee: 21_000n + BigInt(stableHash(input.seedPhrase, input.chainKey, 'transfer-fee').at(0) ?? 0),
    }
  })
}

export async function bridgeUsdt(input: MockWalletBridgeInput): Promise<MockBridgeReceipt> {
  if (!EVM_CHAINS.has(input.chainKey)) {
    throw new Error('Mock bridge source chain must be EVM compatible')
  }

  return withLatency(input.seedPhrase, input.chainKey, 'bridgeUsdt', () => {
    const sourceWallet = createOrGetWallet(input.seedPhrase, input.chainKey, input.index ?? 0)
    if (sourceWallet.usdtRaw < input.amountRaw) {
      throw new Error('Insufficient mock USDT balance')
    }

    const recipientKey = ADDRESS_INDEX.get(input.recipient)
    const recipientWallet = recipientKey ? WALLET_REGISTRY.get(recipientKey) : undefined
    const targetWallet =
      recipientWallet && recipientWallet.chainKey === input.targetChainKey
        ? recipientWallet
        : createOrGetWallet(input.seedPhrase, input.targetChainKey, input.index ?? 0)
    sourceWallet.usdtRaw -= input.amountRaw
    targetWallet.usdtRaw += input.amountRaw
    sourceWallet.updatedAt = new Date()
    targetWallet.updatedAt = new Date()

    const nonce = sourceWallet.lastBridgeHash ? Number.parseInt(sourceWallet.lastBridgeHash.slice(-8), 16) + 1 : 1
    const hash = buildTxHash(input.seedPhrase, input.targetChainKey, 'bridge', nonce)
    const bridgeFee =
      90_000n + BigInt(stableHash(input.seedPhrase, input.chainKey, input.targetChainKey, 'bridge-fee').at(0) ?? 0)
    sourceWallet.lastBridgeHash = hash

    return {
      hash,
      fee: 35_000n + BigInt(stableHash(input.seedPhrase, input.chainKey, 'bridge-total-fee').at(1) ?? 0),
      bridgeFee,
    }
  })
}

export async function setWalletState(input: MockWalletLookupInput & MockWalletStatePatch): Promise<MockWalletRecord> {
  return withLatency(input.seedPhrase, input.chainKey, 'setWalletState', () => {
    const wallet = createOrGetWallet(input.seedPhrase, input.chainKey, input.index ?? 0)
    if (input.usdtRaw !== undefined) {
      wallet.usdtRaw = input.usdtRaw
    }
    if (input.nativeRaw !== undefined) {
      wallet.nativeRaw = input.nativeRaw
    }
    wallet.updatedAt = new Date()
    return wallet
  })
}

export const wdkMock = {
  createWallet,
  getAddress,
  getNativeBalance,
  getUsdtBalance,
  transferUsdt,
  bridgeUsdt,
  getWallet,
  getAllWallets,
  setWalletState,
} as const
