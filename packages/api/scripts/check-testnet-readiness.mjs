import { JsonRpcProvider } from 'ethers'

import {
  SUPPORTED_EVM_TESTNETS,
  ensureTestnetMode,
  isHexString,
  isPlaceholder,
  readRequiredEnv,
} from './_shared.mjs'

function printStatus(label, ok, detail) {
  const prefix = ok ? '[ok]' : '[missing]'
  console.log(`${prefix} ${label}: ${detail}`)
}

function isWeakEncryptionKey(value) {
  const normalized = value.startsWith('0x') ? value.slice(2) : value
  return /^0+$/.test(normalized)
}

function readTableName(base) {
  const prefix = process.env.SUPABASE_TABLE_PREFIX?.trim() ?? ''
  return `${prefix}${base}`
}

async function checkSupabaseSchema() {
  const url = process.env.SUPABASE_URL?.trim() ?? ''
  const key = process.env.SUPABASE_SERVICE_KEY?.trim() ?? ''
  if (isPlaceholder(url) || isPlaceholder(key)) {
    printStatus('Supabase schema', false, 'SUPABASE_URL or SUPABASE_SERVICE_KEY is still placeholder')
    return
  }

  const response = await fetch(`${url}/rest/v1/${readTableName('agents')}?select=id&limit=1`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  })

  if (response.ok) {
    printStatus('Supabase schema', true, 'agents table is reachable')
    return
  }

  const body = await response.text()
  printStatus('Supabase schema', false, body.slice(0, 160))
}

async function checkEvmRpcs() {
  for (const [chainKey, config] of Object.entries(SUPPORTED_EVM_TESTNETS)) {
    const rpcUrl = process.env[config.rpcEnv]?.trim() ?? ''
    if (!rpcUrl) {
      printStatus(config.label, false, `missing ${config.rpcEnv}`)
      continue
    }

    try {
      const provider = new JsonRpcProvider(rpcUrl)
      const network = await provider.getNetwork()
      const blockNumber = await provider.getBlockNumber()
      const chainOk = network.chainId === config.expectedChainId
      printStatus(
        config.label,
        chainOk,
        chainOk
          ? `rpc ok, chainId=${network.chainId.toString()}, latestBlock=${blockNumber}`
          : `wrong chainId ${network.chainId.toString()} from ${config.rpcEnv}`,
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      printStatus(config.label, false, message)
    }
  }
}

function checkEnvBasics() {
  const encryptionKey = process.env.AGENT_ENCRYPTION_KEY?.trim() ?? ''
  const deployerKey = process.env.TESTNET_DEPLOYER_PRIVATE_KEY?.trim() ?? ''
  const useMockApis = process.env.USE_MOCK_APIS?.trim().toLowerCase()
  const viteNetworkMode = process.env.VITE_NETWORK_MODE?.trim().toLowerCase()
  const tablePrefix = process.env.SUPABASE_TABLE_PREFIX?.trim() ?? ''

  printStatus('NETWORK_MODE', process.env.NETWORK_MODE === 'testnet', process.env.NETWORK_MODE ?? '(unset)')
  printStatus('USE_MOCK_APIS', useMockApis === 'false', process.env.USE_MOCK_APIS ?? '(unset)')
  printStatus('VITE_NETWORK_MODE', viteNetworkMode === 'testnet', process.env.VITE_NETWORK_MODE ?? '(unset)')
  printStatus('SUPABASE_TABLE_PREFIX', true, tablePrefix.length > 0 ? tablePrefix : '(none)')
  printStatus(
    'AGENT_ENCRYPTION_KEY',
    isHexString(encryptionKey, 32) && !isWeakEncryptionKey(encryptionKey),
    !isHexString(encryptionKey, 32)
      ? 'expected 32-byte hex string'
      : isWeakEncryptionKey(encryptionKey)
        ? 'replace the all-zero placeholder with a real random key'
        : 'looks valid',
  )
  printStatus(
    'TESTNET_DEPLOYER_PRIVATE_KEY',
    deployerKey.length === 0 || isHexString(deployerKey, 32),
    deployerKey.length === 0 ? 'optional until you deploy your own test token' : 'looks valid',
  )
}

function checkTokenAddresses() {
  const tokenChecks = [
    ['ETH_SEPOLIA_USDT_ADDRESS', process.env.ETH_SEPOLIA_USDT_ADDRESS ?? ''],
    ['POLYGON_AMOY_USDT_ADDRESS', process.env.POLYGON_AMOY_USDT_ADDRESS ?? ''],
    ['ARBITRUM_SEPOLIA_USDT_ADDRESS', process.env.ARBITRUM_SEPOLIA_USDT_ADDRESS ?? ''],
    ['SOLANA_DEVNET_USDT_ADDRESS', process.env.SOLANA_DEVNET_USDT_ADDRESS ?? ''],
    ['TON_TESTNET_USDT_ADDRESS', process.env.TON_TESTNET_USDT_ADDRESS ?? ''],
  ]

  for (const [name, value] of tokenChecks) {
    const trimmed = value.trim()
    printStatus(name, trimmed.length > 0, trimmed.length > 0 ? trimmed : 'not set')
  }
}

async function main() {
  ensureTestnetMode()
  readRequiredEnv('SUPABASE_URL')

  console.log('Arbiter testnet readiness')
  console.log('------------------------')
  checkEnvBasics()
  console.log('')
  checkTokenAddresses()
  console.log('')
  await checkEvmRpcs()
  console.log('')
  await checkSupabaseSchema()
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(message)
  process.exitCode = 1
})
