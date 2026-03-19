import path from 'node:path'
import { fileURLToPath } from 'node:url'

import dotenv from 'dotenv'
import { JsonRpcProvider } from 'ethers'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const rootEnvPath = path.resolve(scriptDirectory, '../../../.env')
const rootTestnetEnvPath = path.resolve(scriptDirectory, '../../../.env.testnet')

dotenv.config({ path: rootEnvPath, override: false })
dotenv.config({ path: rootTestnetEnvPath, override: false })

export const SUPPORTED_EVM_TESTNETS = {
  ethereum: {
    label: 'Ethereum Sepolia',
    rpcEnv: 'ETH_SEPOLIA_RPC_URL',
    tokenEnv: 'ETH_SEPOLIA_USDT_ADDRESS',
    expectedChainId: 11155111n,
  },
  polygon: {
    label: 'Polygon Amoy',
    rpcEnv: 'POLYGON_AMOY_RPC_URL',
    tokenEnv: 'POLYGON_AMOY_USDT_ADDRESS',
    expectedChainId: 80002n,
  },
  arbitrum: {
    label: 'Arbitrum Sepolia',
    rpcEnv: 'ARBITRUM_SEPOLIA_RPC_URL',
    tokenEnv: 'ARBITRUM_SEPOLIA_USDT_ADDRESS',
    expectedChainId: 421614n,
  },
}

export function parseArgs(argv) {
  const args = {}

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]
    if (!value.startsWith('--')) {
      continue
    }

    const key = value.slice(2)
    const next = argv[index + 1]
    if (!next || next.startsWith('--')) {
      args[key] = 'true'
      continue
    }

    args[key] = next
    index += 1
  }

  return args
}

export function ensureTestnetMode() {
  const networkMode = process.env.NETWORK_MODE?.trim().toLowerCase()
  if (networkMode !== 'testnet') {
    throw new Error('Set NETWORK_MODE=testnet before using the live testnet helper scripts')
  }
}

export function readRequiredEnv(name) {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

export function getTestnetConfig(chainKey) {
  const config = SUPPORTED_EVM_TESTNETS[chainKey]
  if (!config) {
    throw new Error(`Unsupported chain "${chainKey}". Use one of: ${Object.keys(SUPPORTED_EVM_TESTNETS).join(', ')}`)
  }

  return config
}

export function getSuggestedTokenEnv(chainKey) {
  return getTestnetConfig(chainKey).tokenEnv
}

export async function verifyRpcConnection(chainKey) {
  const config = getTestnetConfig(chainKey)
  const provider = new JsonRpcProvider(readRequiredEnv(config.rpcEnv))
  const network = await provider.getNetwork()
  if (network.chainId !== config.expectedChainId) {
    throw new Error(
      `${config.label} RPC returned chainId ${network.chainId.toString()}, expected ${config.expectedChainId.toString()}`,
    )
  }

  return { provider, network }
}

export function isHexString(value, expectedBytes) {
  const normalized = value.startsWith('0x') ? value.slice(2) : value
  return normalized.length === expectedBytes * 2 && /^[0-9a-fA-F]+$/.test(normalized)
}

export function isPlaceholder(value) {
  if (!value) {
    return true
  }

  const normalized = value.trim().toLowerCase()
  return normalized.length === 0 || normalized === 'placeholder'
}
