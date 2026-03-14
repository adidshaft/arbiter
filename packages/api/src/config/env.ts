import { config as loadDotenv } from 'dotenv'
import { z } from 'zod'

loadDotenv()

const placeholderStrings = new Set(['', 'placeholder', 'placeholder_replace_with_real_key'])

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  USE_MOCK_APIS: z.string().default('true'),
  PORT: z.coerce.number().int().positive().default(3001),
  OPENAI_API_KEY: z.string().optional().default(''),
  AGENT_ENCRYPTION_KEY: z.string().optional().default(''),
  SUPABASE_URL: z.string().optional().default(''),
  SUPABASE_ANON_KEY: z.string().optional().default(''),
  SUPABASE_SERVICE_KEY: z.string().optional().default(''),
  ETH_RPC_URL: z.string().optional().default('https://eth.drpc.org'),
  POLYGON_RPC_URL: z.string().optional().default('https://polygon-rpc.com'),
  ARBITRUM_RPC_URL: z.string().optional().default('https://arb1.arbitrum.io/rpc'),
  SOLANA_RPC_URL: z.string().optional().default('https://api.mainnet-beta.solana.com'),
  TON_RPC_URL: z.string().optional().default('https://toncenter.com/api/v2/jsonRPC')
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

