import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { config as loadDotenv } from 'dotenv'
import { z } from 'zod'

const currentDirectory = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(currentDirectory, '../../../..')

loadDotenv({ path: path.join(repoRoot, '.env'), override: false })
loadDotenv({ path: path.join(repoRoot, '.env.local'), override: false })
loadDotenv({ override: false })

const placeholderStrings = new Set(['', 'placeholder', 'placeholder_replace_with_real_key'])

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NETWORK_MODE: z.enum(['mainnet', 'testnet']).default('mainnet'),
  USE_MOCK_APIS: z.string().default('true'),
  PORT: z.coerce.number().int().positive().default(3001),
  OPENAI_API_KEY: z.string().optional().default(''),
  AGENT_ENCRYPTION_KEY: z.string().optional().default(''),
  SUPABASE_URL: z.string().optional().default(''),
  SUPABASE_ANON_KEY: z.string().optional().default(''),
  SUPABASE_SERVICE_KEY: z.string().optional().default(''),
  SUPABASE_TABLE_PREFIX: z.string().optional().default(''),
  ETH_RPC_URL: z.string().optional().default('https://eth.drpc.org'),
  ETH_USDT_ADDRESS: z.string().optional().default('0xdAC17F958D2ee523a2206206994597C13D831ec7'),
  POLYGON_RPC_URL: z.string().optional().default('https://polygon-rpc.com'),
  POLYGON_USDT_ADDRESS: z.string().optional().default('0xc2132D05D31c914a87C6611C10748AEb04B58e8F'),
  ARBITRUM_RPC_URL: z.string().optional().default('https://arb1.arbitrum.io/rpc'),
  ARBITRUM_USDT_ADDRESS: z.string().optional().default('0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9'),
  SOLANA_RPC_URL: z.string().optional().default('https://api.mainnet-beta.solana.com'),
  SOLANA_USDT_ADDRESS: z.string().optional().default('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'),
  TON_RPC_URL: z.string().optional().default('https://toncenter.com/api/v2/jsonRPC'),
  TON_USDT_ADDRESS: z.string().optional().default('EQCajaUU1XXSAjTD-xOV7pE49fGtg4q8kF3ELCOxj5Rq_eYZ'),
  ETH_SEPOLIA_RPC_URL: z.string().optional().default('https://sepolia.drpc.org'),
  ETH_SEPOLIA_USDT_ADDRESS: z.string().optional().default('0xd077a400968890eacc75cdc901f0356c943e4fdb'),
  POLYGON_AMOY_RPC_URL: z.string().optional().default('https://rpc-amoy.polygon.technology'),
  POLYGON_AMOY_USDT_ADDRESS: z.string().optional().default(''),
  ARBITRUM_SEPOLIA_RPC_URL: z.string().optional().default('https://sepolia-rollup.arbitrum.io/rpc'),
  ARBITRUM_SEPOLIA_USDT_ADDRESS: z.string().optional().default(''),
  SOLANA_DEVNET_RPC_URL: z.string().optional().default('https://api.devnet.solana.com'),
  SOLANA_DEVNET_USDT_ADDRESS: z.string().optional().default(''),
  TON_TESTNET_RPC_URL: z.string().optional().default('https://testnet.toncenter.com/api/v2/jsonRPC'),
  TON_TESTNET_USDT_ADDRESS: z.string().optional().default(''),
  BITCOIN_MAINNET_ELECTRUM_HOST: z.string().optional().default('electrum.blockstream.info'),
  BITCOIN_MAINNET_ELECTRUM_PORT: z.coerce.number().int().positive().default(50001),
  BITCOIN_TESTNET_ELECTRUM_HOST: z.string().optional().default('electrum.blockstream.info'),
  BITCOIN_TESTNET_ELECTRUM_PORT: z.coerce.number().int().positive().default(60001)
})

export type ApiEnv = z.infer<typeof envSchema>

export function readEnv(): ApiEnv {
  const parsed = envSchema.parse(process.env)
  return parsed
}

export function isMockMode(env: ApiEnv): boolean {
  return env.USE_MOCK_APIS.trim().toLowerCase() === 'true'
    || placeholderStrings.has(env.SUPABASE_URL.trim().toLowerCase())
    || placeholderStrings.has(env.SUPABASE_ANON_KEY.trim().toLowerCase())
    || placeholderStrings.has(env.SUPABASE_SERVICE_KEY.trim().toLowerCase())
}

export function isUsableOpenAiKey(env: ApiEnv): boolean {
  const key = env.OPENAI_API_KEY.trim()
  return key.length > 0 && !placeholderStrings.has(key.toLowerCase())
}
