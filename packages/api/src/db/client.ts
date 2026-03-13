import type {
  AgentBalance,
  Alert,
  ContractTrustRecord,
  CreditHistory,
  Loan,
  OrchestratorEvent,
  SkillExecution
} from '@arbiter/core'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readEnv, isMockMode } from '../config/env.js'
import type { AgentRecord, ArbiterStore } from '../models.js'
import { createMemoryStore } from './memoryStore.js'

function isPlaceholder(value: string): boolean {
  const normalized = value.trim().toLowerCase()
  return normalized.length === 0 || normalized === 'placeholder'
}

function serializeAgentRecord(agent: AgentRecord): Record<string, unknown> {
  return {
    id: agent.id,
    name: agent.name,
    role: agent.role,
    status: agent.status,
    config: agent.config,
    credit_score: agent.creditScore,
    wallets: agent.wallets,
    encrypted_seed: agent.encryptedSeed,
    created_at: agent.createdAt.toISOString(),
    updated_at: agent.updatedAt.toISOString()
  }
}

function deserializeAgentRecord(row: Record<string, unknown>): AgentRecord {
  return {
    id: String(row.id),
    name: String(row.name),
    role: String(row.role) as AgentRecord['role'],
    status: String(row.status) as AgentRecord['status'],
    config: row.config as AgentRecord['config'],
    creditScore: Number(row.credit_score),
    wallets: row.wallets as AgentRecord['wallets'],
    encryptedSeed: String(row.encrypted_seed),
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at))
  }
}

function serializeBalance(balance: AgentBalance): Record<string, unknown> {
  return {
    id: `${balance.agentId}:${balance.chainKey}`,
    agent_id: balance.agentId,
    chain_key: balance.chainKey,
    address: balance.address,
    usdt_human: balance.usdtHuman,
    usdt_raw: balance.usdtRaw.toString(),
    native_human: balance.nativeHuman,
    updated_at: balance.updatedAt.toISOString()
  }
}

function deserializeBalance(row: Record<string, unknown>): AgentBalance {
  return {
    agentId: String(row.agent_id),
    chainKey: String(row.chain_key) as AgentBalance['chainKey'],
    address: String(row.address),
    usdtHuman: String(row.usdt_human),
    usdtRaw: BigInt(String(row.usdt_raw)),
    nativeHuman: String(row.native_human),
    updatedAt: new Date(String(row.updated_at))
  }
}

function serializeTrustRecord(record: ContractTrustRecord): Record<string, unknown> {
  return {
    id: record.id,
    contract_address: record.contractAddress,
    chain_key: record.chainKey,
    score: record.score,
    confidence: record.confidence,
    reasons: record.reasons,
    raw_analysis: record.rawAnalysis,
    is_proxy: record.isProxy,
    contract_age: record.contractAge,
    last_volume_usd: record.lastVolumeUsd,
    has_verified_source: record.hasVerifiedSource,
    scored_at: record.scoredAt.toISOString(),
    refresh_trigger: record.refreshTrigger ?? null
  }
}

function deserializeTrustRecord(row: Record<string, unknown>): ContractTrustRecord {
  return {
    id: String(row.id),
    contractAddress: String(row.contract_address),
    chainKey: String(row.chain_key) as ContractTrustRecord['chainKey'],
    score: String(row.score) as ContractTrustRecord['score'],
    confidence: Number(row.confidence),
    reasons: (row.reasons as string[]) ?? [],
    rawAnalysis: String(row.raw_analysis),
    isProxy: Boolean(row.is_proxy),
    contractAge: Number(row.contract_age),
    lastVolumeUsd: Number(row.last_volume_usd),
    hasVerifiedSource: Boolean(row.has_verified_source),
    scoredAt: new Date(String(row.scored_at)),
    refreshTrigger: row.refresh_trigger ? String(row.refresh_trigger) : undefined
  }
}

function serializeLoan(loan: Loan): Record<string, unknown> {
  return {
    id: loan.id,
    request_id: loan.requestId,
    lender_agent_id: loan.lenderAgentId,
    borrower_agent_id: loan.borrowerAgentId,
    principal: loan.principal,
    interest_rate: loan.interestRate,
    interest_amount: loan.interestAmount,
    total_repayment: loan.totalRepayment,
    chain_key: loan.chainKey,
    target_contract: loan.targetContract,
    trust_score: loan.trustScore,
    status: loan.status,
    lender_tx_hash: loan.lenderTxHash ?? null,
    borrower_tx_hash: loan.borrowerTxHash ?? null,
    bridge_tx_hash: loan.bridgeTxHash ?? null,
    is_cross_chain: loan.isCrossChain,
    lender_chain_key: loan.lenderChainKey ?? null,
    created_at: loan.createdAt.toISOString(),
    disbursed_at: loan.disbursedAt?.toISOString() ?? null,
    repaid_at: loan.repaidAt?.toISOString() ?? null,
    due_at: loan.dueAt.toISOString()
  }
}

function deserializeLoan(row: Record<string, unknown>): Loan {
  return {
    id: String(row.id),
    requestId: String(row.request_id),
    lenderAgentId: String(row.lender_agent_id),
    borrowerAgentId: String(row.borrower_agent_id),
    principal: Number(row.principal),
    interestRate: Number(row.interest_rate),
    interestAmount: Number(row.interest_amount),
    totalRepayment: Number(row.total_repayment),
    chainKey: String(row.chain_key) as Loan['chainKey'],
    targetContract: String(row.target_contract),
    trustScore: String(row.trust_score) as Loan['trustScore'],
    status: String(row.status) as Loan['status'],
    lenderTxHash: row.lender_tx_hash ? String(row.lender_tx_hash) : undefined,
    borrowerTxHash: row.borrower_tx_hash ? String(row.borrower_tx_hash) : undefined,
    bridgeTxHash: row.bridge_tx_hash ? String(row.bridge_tx_hash) : undefined,
    isCrossChain: Boolean(row.is_cross_chain),
    lenderChainKey: row.lender_chain_key ? String(row.lender_chain_key) as Loan['lenderChainKey'] : undefined,
    createdAt: new Date(String(row.created_at)),
    disbursedAt: row.disbursed_at ? new Date(String(row.disbursed_at)) : undefined,
    repaidAt: row.repaid_at ? new Date(String(row.repaid_at)) : undefined,
    dueAt: new Date(String(row.due_at))
  }
}

function serializeCreditHistory(history: CreditHistory): Record<string, unknown> {
  return {
    agent_id: history.agentId,
    total_loans: history.totalLoans,
    successful_repayments: history.successfulRepayments,
    defaulted_loans: history.defaultedLoans,
    total_borrowed: history.totalBorrowed,
    total_repaid: history.totalRepaid,
    average_repayment_days: history.averageRepaymentDays,
    score: history.score,
    last_updated: history.lastUpdated.toISOString()
  }
}

function deserializeCreditHistory(row: Record<string, unknown>): CreditHistory {
  return {
    agentId: String(row.agent_id),
    totalLoans: Number(row.total_loans),
    successfulRepayments: Number(row.successful_repayments),
    defaultedLoans: Number(row.defaulted_loans),
    totalBorrowed: Number(row.total_borrowed),
    totalRepaid: Number(row.total_repaid),
    averageRepaymentDays: Number(row.average_repayment_days),
    score: Number(row.score),
    lastUpdated: new Date(String(row.last_updated))
  }
}

function serializeSkillExecution(execution: SkillExecution): Record<string, unknown> {
  return {
    execution_id: execution.executionId,
    skill_id: execution.skillId,
    agent_id: execution.agentId,
    chain_key: execution.chainKey,
    status: execution.status,
    input: execution.input,
    output: execution.output ?? null,
    error: execution.error ?? null,
    tx_hash: execution.txHash ?? null,
    started_at: execution.startedAt.toISOString(),
    completed_at: execution.completedAt?.toISOString() ?? null
  }
}

function deserializeSkillExecution(row: Record<string, unknown>): SkillExecution {
  return {
    executionId: String(row.execution_id),
    skillId: String(row.skill_id),
    agentId: String(row.agent_id),
    chainKey: String(row.chain_key) as SkillExecution['chainKey'],
    status: String(row.status) as SkillExecution['status'],
    input: (row.input as Record<string, unknown>) ?? {},
    output: row.output ? (row.output as Record<string, unknown>) : undefined,
    error: row.error ? String(row.error) : undefined,
    txHash: row.tx_hash ? String(row.tx_hash) : undefined,
    startedAt: new Date(String(row.started_at)),
    completedAt: row.completed_at ? new Date(String(row.completed_at)) : undefined
  }
}

function serializeAlert(alert: Alert): Record<string, unknown> {
  return {
    id: alert.id,
    type: alert.type,
    severity: alert.severity,
    agent_id: alert.agentId,
    message: alert.message,
    metadata: alert.metadata ?? null,
    dismissed: alert.dismissed,
    created_at: alert.createdAt.toISOString()
  }
}

function deserializeAlert(row: Record<string, unknown>): Alert {
  return {
    id: String(row.id),
    type: String(row.type) as Alert['type'],
    severity: String(row.severity) as Alert['severity'],
    agentId: String(row.agent_id),
    message: String(row.message),
    metadata: row.metadata ? (row.metadata as Record<string, unknown>) : undefined,
    dismissed: Boolean(row.dismissed),
    createdAt: new Date(String(row.created_at))
  }
}

function serializeEvent(event: OrchestratorEvent): Record<string, unknown> {
  return {
    id: event.id,
    type: event.type,
    payload: event.payload,
    timestamp: event.timestamp.toISOString()
  }
}

function deserializeEvent(row: Record<string, unknown>): OrchestratorEvent {
  return {
    id: String(row.id),
    type: String(row.type) as OrchestratorEvent['type'],
    payload: (row.payload as Record<string, unknown>) ?? {},
    timestamp: new Date(String(row.timestamp))
  }
}

async function expectData<T>(promise: PromiseLike<{ data: T | null; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await promise
  if (error) {
    throw new Error(error.message)
  }
  if (data === null) {
    throw new Error('Expected row but none was returned')
  }
  return data
}

function asRow(value: unknown): Record<string, unknown> {
  return value as Record<string, unknown>
}

class SupabaseStore implements ArbiterStore {
  readonly mode = 'supabase' as const

  constructor(private readonly client: SupabaseClient) {}

  async reset(): Promise<void> {
    await this.client.from('orchestrator_events').delete().neq('id', '')
    await this.client.from('alerts').delete().neq('id', '')
    await this.client.from('skill_executions').delete().neq('execution_id', '')
    await this.client.from('agent_balances').delete().neq('id', '')
    await this.client.from('credit_history').delete().neq('agent_id', '')
    await this.client.from('loans').delete().neq('id', '')
    await this.client.from('contract_trust_records').delete().neq('id', '')
    await this.client.from('agents').delete().neq('id', '')
  }

  async listAgents(): Promise<AgentRecord[]> {
    const { data, error } = await this.client.from('agents').select('*').order('created_at', { ascending: true })
    if (error) throw new Error(error.message)
    return ((data ?? []) as Record<string, unknown>[]).map(deserializeAgentRecord)
  }

  async getAgent(id: string): Promise<AgentRecord | null> {
    const { data, error } = await this.client.from('agents').select('*').eq('id', id).maybeSingle()
    if (error) throw new Error(error.message)
    return data ? deserializeAgentRecord(asRow(data)) : null
  }

  async createAgent(agent: AgentRecord): Promise<AgentRecord> {
    const data = await expectData(this.client.from('agents').insert(serializeAgentRecord(agent)).select('*').single())
    return deserializeAgentRecord(asRow(data))
  }

  async updateAgent(id: string, patch: Partial<AgentRecord>): Promise<AgentRecord | null> {
    const payload: Record<string, unknown> = {}
    if (patch.name !== undefined) payload.name = patch.name
    if (patch.role !== undefined) payload.role = patch.role
    if (patch.status !== undefined) payload.status = patch.status
    if (patch.config !== undefined) payload.config = patch.config
    if (patch.creditScore !== undefined) payload.credit_score = patch.creditScore
    if (patch.wallets !== undefined) payload.wallets = patch.wallets
    if (patch.encryptedSeed !== undefined) payload.encrypted_seed = patch.encryptedSeed
    if (patch.updatedAt !== undefined) payload.updated_at = patch.updatedAt.toISOString()
    const { data, error } = await this.client.from('agents').update(payload).eq('id', id).select('*').maybeSingle()
    if (error) throw new Error(error.message)
    return data ? deserializeAgentRecord(asRow(data)) : null
  }

  async deleteAgent(id: string): Promise<boolean> {
    const { error } = await this.client.from('agents').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return true
  }

  async pauseAllAgents(): Promise<AgentRecord[]> {
    const { data, error } = await this.client.from('agents').update({ status: 'paused' }).neq('id', '').select('*')
    if (error) throw new Error(error.message)
    return ((data ?? []) as Record<string, unknown>[]).map(deserializeAgentRecord)
  }

  async listBalances(): Promise<AgentBalance[]> {
    const { data, error } = await this.client.from('agent_balances').select('*')
    if (error) throw new Error(error.message)
    return ((data ?? []) as Record<string, unknown>[]).map(deserializeBalance)
  }

  async listBalancesByAgent(agentId: string): Promise<AgentBalance[]> {
    const { data, error } = await this.client.from('agent_balances').select('*').eq('agent_id', agentId)
    if (error) throw new Error(error.message)
    return ((data ?? []) as Record<string, unknown>[]).map(deserializeBalance)
  }

  async upsertBalance(balance: AgentBalance): Promise<AgentBalance> {
    const data = await expectData(
      this.client.from('agent_balances').upsert(serializeBalance(balance), { onConflict: 'id' }).select('*').single()
    )
    return deserializeBalance(asRow(data))
  }

  async upsertBalances(balances: AgentBalance[]): Promise<AgentBalance[]> {
    const { data, error } = await this.client
      .from('agent_balances')
      .upsert(balances.map(serializeBalance), { onConflict: 'id' })
      .select('*')
    if (error) throw new Error(error.message)
    return ((data ?? []) as Record<string, unknown>[]).map(deserializeBalance)
  }

  async deleteBalancesForAgent(agentId: string): Promise<void> {
    const { error } = await this.client.from('agent_balances').delete().eq('agent_id', agentId)
    if (error) throw new Error(error.message)
  }

  async listTrustRecords(): Promise<ContractTrustRecord[]> {
    const { data, error } = await this.client.from('contract_trust_records').select('*')
    if (error) throw new Error(error.message)
    return ((data ?? []) as Record<string, unknown>[]).map(deserializeTrustRecord)
  }

  async findTrustRecord(contractAddress: string, chainKey: ContractTrustRecord['chainKey']): Promise<ContractTrustRecord | null> {
    const { data, error } = await this.client
      .from('contract_trust_records')
      .select('*')
      .eq('contract_address', contractAddress)
      .eq('chain_key', chainKey)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data ? deserializeTrustRecord(asRow(data)) : null
  }

  async upsertTrustRecord(record: ContractTrustRecord): Promise<ContractTrustRecord> {
    const data = await expectData(
      this.client
        .from('contract_trust_records')
        .upsert(serializeTrustRecord(record), { onConflict: 'contract_address,chain_key' })
        .select('*')
        .single()
    )
    return deserializeTrustRecord(asRow(data))
  }

  async deleteTrustRecord(contractAddress: string): Promise<boolean> {
    const { error } = await this.client.from('contract_trust_records').delete().eq('contract_address', contractAddress)
    if (error) throw new Error(error.message)
    return true
  }

  async listLoans(): Promise<Loan[]> {
    const { data, error } = await this.client.from('loans').select('*').order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return ((data ?? []) as Record<string, unknown>[]).map(deserializeLoan)
  }

  async getLoan(id: string): Promise<Loan | null> {
    const { data, error } = await this.client.from('loans').select('*').eq('id', id).maybeSingle()
    if (error) throw new Error(error.message)
    return data ? deserializeLoan(asRow(data)) : null
  }

  async createLoan(loan: Loan): Promise<Loan> {
    const data = await expectData(this.client.from('loans').insert(serializeLoan(loan)).select('*').single())
    return deserializeLoan(asRow(data))
  }

  async updateLoan(id: string, patch: Partial<Loan>): Promise<Loan | null> {
    const payload: Record<string, unknown> = {}
    if (patch.status !== undefined) payload.status = patch.status
    if (patch.trustScore !== undefined) payload.trust_score = patch.trustScore
    if (patch.lenderTxHash !== undefined) payload.lender_tx_hash = patch.lenderTxHash
    if (patch.borrowerTxHash !== undefined) payload.borrower_tx_hash = patch.borrowerTxHash
    if (patch.bridgeTxHash !== undefined) payload.bridge_tx_hash = patch.bridgeTxHash
    if (patch.disbursedAt !== undefined) payload.disbursed_at = patch.disbursedAt?.toISOString() ?? null
    if (patch.repaidAt !== undefined) payload.repaid_at = patch.repaidAt?.toISOString() ?? null
    if (patch.dueAt !== undefined) payload.due_at = patch.dueAt.toISOString()
    if (patch.lenderChainKey !== undefined) payload.lender_chain_key = patch.lenderChainKey
    if (patch.isCrossChain !== undefined) payload.is_cross_chain = patch.isCrossChain
    const { data, error } = await this.client.from('loans').update(payload).eq('id', id).select('*').maybeSingle()
    if (error) throw new Error(error.message)
    return data ? deserializeLoan(asRow(data)) : null
  }

  async getCreditHistory(agentId: string): Promise<CreditHistory | null> {
    const { data, error } = await this.client.from('credit_history').select('*').eq('agent_id', agentId).maybeSingle()
    if (error) throw new Error(error.message)
    return data ? deserializeCreditHistory(asRow(data)) : null
  }

  async upsertCreditHistory(history: CreditHistory): Promise<CreditHistory> {
    const data = await expectData(
      this.client.from('credit_history').upsert(serializeCreditHistory(history), { onConflict: 'agent_id' }).select('*').single()
    )
    return deserializeCreditHistory(asRow(data))
  }

  async listSkillExecutions(): Promise<SkillExecution[]> {
    const { data, error } = await this.client.from('skill_executions').select('*').order('started_at', { ascending: false })
    if (error) throw new Error(error.message)
    return ((data ?? []) as Record<string, unknown>[]).map(deserializeSkillExecution)
  }

  async getSkillExecution(id: string): Promise<SkillExecution | null> {
    const { data, error } = await this.client.from('skill_executions').select('*').eq('execution_id', id).maybeSingle()
    if (error) throw new Error(error.message)
    return data ? deserializeSkillExecution(asRow(data)) : null
  }

  async createSkillExecution(execution: SkillExecution): Promise<SkillExecution> {
    const data = await expectData(
      this.client.from('skill_executions').insert(serializeSkillExecution(execution)).select('*').single()
    )
    return deserializeSkillExecution(asRow(data))
  }

  async updateSkillExecution(id: string, patch: Partial<SkillExecution>): Promise<SkillExecution | null> {
    const payload: Record<string, unknown> = {}
    if (patch.status !== undefined) payload.status = patch.status
    if (patch.output !== undefined) payload.output = patch.output
    if (patch.error !== undefined) payload.error = patch.error
    if (patch.txHash !== undefined) payload.tx_hash = patch.txHash
    if (patch.completedAt !== undefined) payload.completed_at = patch.completedAt?.toISOString() ?? null
    const { data, error } = await this.client.from('skill_executions').update(payload).eq('execution_id', id).select('*').maybeSingle()
    if (error) throw new Error(error.message)
    return data ? deserializeSkillExecution(asRow(data)) : null
  }

  async listAlerts(): Promise<Alert[]> {
    const { data, error } = await this.client.from('alerts').select('*').order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return ((data ?? []) as Record<string, unknown>[]).map(deserializeAlert)
  }

  async getAlert(id: string): Promise<Alert | null> {
    const { data, error } = await this.client.from('alerts').select('*').eq('id', id).maybeSingle()
    if (error) throw new Error(error.message)
    return data ? deserializeAlert(asRow(data)) : null
  }

  async createAlert(alert: Alert): Promise<Alert> {
    const data = await expectData(this.client.from('alerts').insert(serializeAlert(alert)).select('*').single())
    return deserializeAlert(asRow(data))
  }

  async updateAlert(id: string, patch: Partial<Alert>): Promise<Alert | null> {
    const payload: Record<string, unknown> = {}
    if (patch.dismissed !== undefined) payload.dismissed = patch.dismissed
    if (patch.metadata !== undefined) payload.metadata = patch.metadata
    const { data, error } = await this.client.from('alerts').update(payload).eq('id', id).select('*').maybeSingle()
    if (error) throw new Error(error.message)
    return data ? deserializeAlert(asRow(data)) : null
  }

  async listEvents(limit = 100): Promise<OrchestratorEvent[]> {
    const { data, error } = await this.client.from('orchestrator_events').select('*').order('timestamp', { ascending: false }).limit(limit)
    if (error) throw new Error(error.message)
    return ((data ?? []) as Record<string, unknown>[]).map(deserializeEvent)
  }

  async createEvent(event: OrchestratorEvent): Promise<OrchestratorEvent> {
    const data = await expectData(this.client.from('orchestrator_events').insert(serializeEvent(event)).select('*').single())
    return deserializeEvent(asRow(data))
  }
}

export function createStore(): ArbiterStore {
  const env = readEnv()
  if (
    isMockMode(env) ||
    isPlaceholder(env.SUPABASE_URL) ||
    isPlaceholder(env.SUPABASE_SERVICE_KEY)
  ) {
    return createMemoryStore()
  }

  const client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY)
  return new SupabaseStore(client)
}
