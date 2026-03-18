import { SUPPORTED_CHAINS, defaultCreditHistory, type Agent, type ChainKey, type ContractTrustRecord, type CreditHistory } from '@arbiter/core'
import { ALL_CHAIN_KEYS, toCoreChain, toWalletChain } from '../chains.js'
import type { AgentRecord, ArbiterStore } from '../models.js'
import { createId } from '../utils/ids.js'
import { createAgentWallet, setMockWalletState } from '../services/wdk/walletService.js'
import { defaultAgentConfig, refreshAgentBalances } from '../services/fleet.js'

interface DemoAgentSeed {
  id: string
  name: string
  role: Agent['role']
  creditScore: number
  config: Agent['config']
  seedPhrase: string
}

const DEMO_AGENTS: DemoAgentSeed[] = [
  {
    id: 'agent_alpha',
    name: 'Alpha lender',
    role: 'lender',
    creditScore: 820,
    config: { ...defaultAgentConfig(), lendingOptIn: true, preferredChains: ['POLYGON', 'ARBITRUM'], minBalanceFloor: 40 },
    seedPhrase: 'alpha-lender-demo-seed-material'
  },
  {
    id: 'agent_beta',
    name: 'Beta borrower',
    role: 'borrower',
    creditScore: 620,
    config: { ...defaultAgentConfig(), lendingOptIn: false, preferredChains: ['POLYGON'], minBalanceFloor: 15 },
    seedPhrase: 'beta-borrower-demo-seed-material'
  },
  {
    id: 'agent_gamma',
    name: 'Gamma executor',
    role: 'executor',
    creditScore: 710,
    config: { ...defaultAgentConfig(), lendingOptIn: false, preferredChains: ['ARBITRUM'], minBalanceFloor: 20 },
    seedPhrase: 'gamma-executor-demo-seed-material'
  }
]

const DEMO_BALANCES: Record<string, Partial<Record<ChainKey, number>>> = {
  agent_alpha: { POLYGON: 400, ETHEREUM: 90, ARBITRUM: 35, SOLANA: 12, TON: 8, BITCOIN: 1.25 },
  agent_beta: { POLYGON: 20, ETHEREUM: 8, ARBITRUM: 5, SOLANA: 2, TON: 1, BITCOIN: 0.5 },
  agent_gamma: { ARBITRUM: 150, POLYGON: 45, ETHEREUM: 25, SOLANA: 6, TON: 3, BITCOIN: 0.75 }
}

const TRUST_RECORDS: Array<Pick<ContractTrustRecord, 'contractAddress' | 'chainKey' | 'score' | 'confidence' | 'reasons' | 'rawAnalysis' | 'isProxy' | 'contractAge' | 'lastVolumeUsd' | 'hasVerifiedSource'>> = [
  {
    contractAddress: '0xfeed000000000000000000000000000000000001',
    chainKey: 'POLYGON',
    score: 'GREEN',
    confidence: 0.92,
    reasons: ['verified source', 'stable volume', 'consistent age'],
    rawAnalysis: 'Deterministic demo green record',
    isProxy: false,
    contractAge: 540,
    lastVolumeUsd: 220000,
    hasVerifiedSource: true
  },
  {
    contractAddress: '0xfeed000000000000000000000000000000000002',
    chainKey: 'ARBITRUM',
    score: 'GREEN',
    confidence: 0.88,
    reasons: ['verified source', 'active flow'],
    rawAnalysis: 'Deterministic demo green record',
    isProxy: false,
    contractAge: 220,
    lastVolumeUsd: 175000,
    hasVerifiedSource: true
  },
  {
    contractAddress: '0xfeed000000000000000000000000000000000003',
    chainKey: 'ETHEREUM',
    score: 'YELLOW',
    confidence: 0.67,
    reasons: ['proxy detected', 'unverified source'],
    rawAnalysis: 'Deterministic demo yellow record',
    isProxy: true,
    contractAge: 44,
    lastVolumeUsd: 72000,
    hasVerifiedSource: false
  },
  {
    contractAddress: '0xfeed000000000000000000000000000000000004',
    chainKey: 'SOLANA',
    score: 'UNKNOWN',
    confidence: 0.51,
    reasons: ['limited history'],
    rawAnalysis: 'Deterministic demo unknown record',
    isProxy: false,
    contractAge: 12,
    lastVolumeUsd: 18000,
    hasVerifiedSource: false
  },
  {
    contractAddress: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
    chainKey: 'POLYGON',
    score: 'RED',
    confidence: 0.97,
    reasons: ['malicious pattern', 'no verified source', 'demo red alert'],
    rawAnalysis: 'Deterministic demo red record',
    isProxy: true,
    contractAge: 4,
    lastVolumeUsd: 50000,
    hasVerifiedSource: false
  }
]

function mapWallets(wallets: Awaited<ReturnType<typeof createAgentWallet>>['wallets']): Agent['wallets'] {
  return wallets.reduce<Agent['wallets']>((accumulator, wallet) => {
    const chainKey = toCoreChain(wallet.chainKey)
    accumulator[chainKey] = { chainKey, address: wallet.address }
    return accumulator
  }, {})
}

async function seedAgent(store: ArbiterStore, definition: DemoAgentSeed): Promise<AgentRecord> {
  const existing = await store.getAgent(definition.id)
  if (existing) {
    return existing
  }

  const walletResult = await createAgentWallet({ agentId: definition.id, seedPhrase: definition.seedPhrase })
  const now = new Date()
  const agent: AgentRecord = {
    id: definition.id,
    name: definition.name,
    role: definition.role,
    status: 'idle',
    config: definition.config,
    creditScore: definition.creditScore,
    wallets: mapWallets(walletResult.wallets),
    encryptedSeed: walletResult.encryptedSeed,
    createdAt: now,
    updatedAt: now
  }
  await store.createAgent(agent)
  return agent
}

async function seedBalances(store: ArbiterStore, agent: AgentRecord, seedPhrase: string): Promise<void> {
  const balanceConfig = DEMO_BALANCES[agent.id] ?? {}
  for (const chainKey of ALL_CHAIN_KEYS) {
    const decimals = SUPPORTED_CHAINS[chainKey].usdtDecimals
    await setMockWalletState({
      seedPhrase,
      chainKey: toWalletChain(chainKey),
      usdtRaw: BigInt(Math.round((balanceConfig[chainKey] ?? 0) * 10 ** decimals))
    })
  }
  await refreshAgentBalances(store, agent)
}

async function seedCreditHistory(store: ArbiterStore, agentId: string, score: number): Promise<void> {
  const existing = await store.getCreditHistory(agentId)
  if (existing) {
    return
  }
  const history: CreditHistory = {
    ...defaultCreditHistory(agentId),
    score,
    totalLoans: score > 700 ? 5 : score > 650 ? 3 : 1,
    successfulRepayments: score > 700 ? 5 : 1,
    defaultedLoans: score > 700 ? 0 : 0,
    totalBorrowed: score > 700 ? 420 : 80,
    totalRepaid: score > 700 ? 420 : 80,
    averageRepaymentDays: score > 700 ? 4 : 8,
    lastUpdated: new Date()
  }
  await store.upsertCreditHistory(history)
}

export async function seedDemoData(store: ArbiterStore): Promise<void> {
  for (const definition of DEMO_AGENTS) {
    const agent = await seedAgent(store, definition)
    await seedBalances(store, agent, definition.seedPhrase)
    await seedCreditHistory(store, agent.id, definition.creditScore)
  }

  const existingTrustRecords = await store.listTrustRecords()
  if (existingTrustRecords.length === 0) {
    for (const trustRecord of TRUST_RECORDS) {
      await store.upsertTrustRecord({
        id: createId('trust'),
        ...trustRecord,
        scoredAt: new Date()
      })
    }
  }

  const alerts = await store.listAlerts()
  if (alerts.length === 0) {
    await store.createAlert({
      id: createId('alert'),
      type: 'low_balance',
      severity: 'info',
      agentId: 'agent_beta',
      message: 'Beta borrower is near its minimum balance floor',
      metadata: { chainKey: 'POLYGON' },
      dismissed: false,
      createdAt: new Date()
    })
  }
}
