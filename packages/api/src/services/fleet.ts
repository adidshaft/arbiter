import { SUPPORTED_CHAINS, type Agent, type AgentBalance, type LendingPool } from '@arbiter/core'
import { ALL_CHAIN_KEYS, DEFAULT_AGENT_CONFIG, formatUsdtHuman, toWalletChain, usdtRawToNumber } from '../chains.js'
import type { AgentRecord, ArbiterStore } from '../models.js'
import { getUsdtBalance } from './wdk/walletService.js'

export function sanitizeAgent(agent: AgentRecord): Agent {
  const { encryptedSeed: _encryptedSeed, ...sanitized } = agent
  return sanitized
}

export function defaultAgentConfig() {
  return {
    ...DEFAULT_AGENT_CONFIG,
    preferredChains: [...DEFAULT_AGENT_CONFIG.preferredChains],
    allowedContracts: [...DEFAULT_AGENT_CONFIG.allowedContracts],
    blockedContracts: [...DEFAULT_AGENT_CONFIG.blockedContracts]
  }
}

export async function refreshAgentBalances(store: ArbiterStore, agent: AgentRecord): Promise<AgentBalance[]> {
  const balances: AgentBalance[] = []

  for (const chainKey of ALL_CHAIN_KEYS) {
    const wallet = agent.wallets[chainKey]
    if (!wallet) {
      continue
    }

    const usdtRaw = await getUsdtBalance({
      encryptedSeed: agent.encryptedSeed,
      chainKey: toWalletChain(chainKey)
    })

    balances.push({
      agentId: agent.id,
      chainKey,
      address: wallet.address,
      usdtRaw,
      usdtHuman: formatUsdtHuman(usdtRaw, chainKey),
      nativeHuman: chainKey === 'BITCOIN' ? '0.10' : '1.25',
      updatedAt: new Date()
    })
  }

  await store.upsertBalances(balances)
  return balances
}

export async function refreshAllAgentBalances(store: ArbiterStore): Promise<AgentBalance[]> {
  const agents = await store.listAgents()
  const balances: AgentBalance[] = []
  for (const agent of agents) {
    balances.push(...(await refreshAgentBalances(store, agent)))
  }
  return balances
}

export async function calculateLendingPool(store: ArbiterStore): Promise<LendingPool> {
  const balances = await store.listBalances()
  const loans = await store.listLoans()
  const activeStatuses = new Set(['approved', 'disbursed', 'executing', 'repaying'])

  const chainBreakdown: LendingPool['chainBreakdown'] = {}
  let totalCapital = 0
  for (const balance of balances) {
    const numericBalance = usdtRawToNumber(balance.usdtRaw, balance.chainKey)
    totalCapital += numericBalance
    chainBreakdown[balance.chainKey] = (chainBreakdown[balance.chainKey] ?? 0) + numericBalance
  }

  const totalLentOut = loans
    .filter((loan) => activeStatuses.has(loan.status))
    .reduce((sum, loan) => sum + loan.principal, 0)

  const availableCapital = Math.max(0, totalCapital - totalLentOut)
  const utilizationRate = totalCapital === 0 ? 0 : Number((totalLentOut / totalCapital).toFixed(4))

  return {
    totalCapital: Number(totalCapital.toFixed(2)),
    availableCapital: Number(availableCapital.toFixed(2)),
    activeLoansCount: loans.filter((loan) => activeStatuses.has(loan.status)).length,
    totalLentOut: Number(totalLentOut.toFixed(2)),
    utilizationRate,
    chainBreakdown
  }
}

export function explorerUrl(chainKey: AgentBalance['chainKey'], txHash: string): string {
  return `${SUPPORTED_CHAINS[chainKey].explorer}/${txHash}`
}

