import type {
  AgentBalance,
  Alert,
  ContractTrustRecord,
  CreditHistory,
  Loan,
  OrchestratorEvent,
  SkillExecution
} from '@arbiter/core'
import { createId } from '../utils/ids.js'
import type { AgentRecord, ArbiterStore } from '../models.js'

function cloneDate(value: Date | undefined): Date | undefined {
  return value ? new Date(value) : undefined
}

function cloneAgent(agent: AgentRecord): AgentRecord {
  return {
    ...agent,
    wallets: { ...agent.wallets },
    config: {
      ...agent.config,
      preferredChains: [...agent.config.preferredChains],
      allowedContracts: [...agent.config.allowedContracts],
      blockedContracts: [...agent.config.blockedContracts]
    },
    createdAt: new Date(agent.createdAt),
    updatedAt: new Date(agent.updatedAt)
  }
}

function cloneBalance(balance: AgentBalance): AgentBalance {
  return { ...balance, updatedAt: new Date(balance.updatedAt) }
}

function cloneTrustRecord(record: ContractTrustRecord): ContractTrustRecord {
  return {
    ...record,
    reasons: [...record.reasons],
    scoredAt: new Date(record.scoredAt)
  }
}

function cloneLoan(loan: Loan): Loan {
  return {
    ...loan,
    createdAt: new Date(loan.createdAt),
    disbursedAt: cloneDate(loan.disbursedAt),
    repaidAt: cloneDate(loan.repaidAt),
    dueAt: new Date(loan.dueAt)
  }
}

function cloneCreditHistory(history: CreditHistory): CreditHistory {
  return { ...history, lastUpdated: new Date(history.lastUpdated) }
}

function cloneSkillExecution(execution: SkillExecution): SkillExecution {
  return {
    ...execution,
    input: { ...execution.input },
    output: execution.output ? { ...execution.output } : undefined,
    startedAt: new Date(execution.startedAt),
    completedAt: cloneDate(execution.completedAt)
  }
}

function cloneAlert(alert: Alert): Alert {
  return {
    ...alert,
    metadata: alert.metadata ? { ...alert.metadata } : undefined,
    createdAt: new Date(alert.createdAt)
  }
}

function cloneEvent(event: OrchestratorEvent): OrchestratorEvent {
  return { ...event, payload: { ...event.payload }, timestamp: new Date(event.timestamp) }
}

export class MemoryStore implements ArbiterStore {
  readonly mode = 'memory' as const

  private readonly agents = new Map<string, AgentRecord>()
  private readonly balances = new Map<string, AgentBalance>()
  private readonly trustRecords = new Map<string, ContractTrustRecord>()
  private readonly loans = new Map<string, Loan>()
  private readonly creditHistory = new Map<string, CreditHistory>()
  private readonly skillExecutions = new Map<string, SkillExecution>()
  private readonly alerts = new Map<string, Alert>()
  private readonly events = new Map<string, OrchestratorEvent>()

  async reset(): Promise<void> {
    this.agents.clear()
    this.balances.clear()
    this.trustRecords.clear()
    this.loans.clear()
    this.creditHistory.clear()
    this.skillExecutions.clear()
    this.alerts.clear()
    this.events.clear()
  }

  async listAgents(): Promise<AgentRecord[]> {
    return [...this.agents.values()].map(cloneAgent)
  }

  async getAgent(id: string): Promise<AgentRecord | null> {
    const agent = this.agents.get(id)
    return agent ? cloneAgent(agent) : null
  }

  async createAgent(agent: AgentRecord): Promise<AgentRecord> {
    this.agents.set(agent.id, cloneAgent(agent))
    return cloneAgent(agent)
  }

  async updateAgent(id: string, patch: Partial<AgentRecord>): Promise<AgentRecord | null> {
    const current = this.agents.get(id)
    if (!current) {
      return null
    }

    const updated: AgentRecord = {
      ...current,
      ...patch,
      wallets: patch.wallets ? { ...patch.wallets } : current.wallets,
      config: patch.config
        ? {
            ...patch.config,
            preferredChains: [...patch.config.preferredChains],
            allowedContracts: [...patch.config.allowedContracts],
            blockedContracts: [...patch.config.blockedContracts]
          }
        : current.config,
      createdAt: patch.createdAt ? new Date(patch.createdAt) : current.createdAt,
      updatedAt: patch.updatedAt ? new Date(patch.updatedAt) : new Date()
    }

    this.agents.set(id, cloneAgent(updated))
    return cloneAgent(updated)
  }

  async deleteAgent(id: string): Promise<boolean> {
    const deleted = this.agents.delete(id)
    if (deleted) {
      for (const [balanceId, balance] of this.balances.entries()) {
        if (balance.agentId === id) {
          this.balances.delete(balanceId)
        }
      }
      this.creditHistory.delete(id)
    }
    return deleted
  }

  async pauseAllAgents(): Promise<AgentRecord[]> {
    const paused: AgentRecord[] = []
    for (const [id, agent] of this.agents.entries()) {
      const updated = { ...agent, status: 'paused' as const, updatedAt: new Date() }
      this.agents.set(id, updated)
      paused.push(cloneAgent(updated))
    }
    return paused
  }

  async listBalances(): Promise<AgentBalance[]> {
    return [...this.balances.values()].map(cloneBalance)
  }

  async listBalancesByAgent(agentId: string): Promise<AgentBalance[]> {
    return [...this.balances.values()].filter((balance) => balance.agentId === agentId).map(cloneBalance)
  }

  async upsertBalance(balance: AgentBalance): Promise<AgentBalance> {
    const balanceId = `${balance.agentId}:${balance.chainKey}`
    this.balances.set(balanceId, cloneBalance(balance))
    return cloneBalance(balance)
  }

  async upsertBalances(balances: AgentBalance[]): Promise<AgentBalance[]> {
    const stored: AgentBalance[] = []
    for (const balance of balances) {
      stored.push(await this.upsertBalance(balance))
    }
    return stored
  }

  async deleteBalancesForAgent(agentId: string): Promise<void> {
    for (const [balanceId, balance] of this.balances.entries()) {
      if (balance.agentId === agentId) {
        this.balances.delete(balanceId)
      }
    }
  }

  async listTrustRecords(): Promise<ContractTrustRecord[]> {
    return [...this.trustRecords.values()].map(cloneTrustRecord)
  }

  async findTrustRecord(contractAddress: string, chainKey: ContractTrustRecord['chainKey']): Promise<ContractTrustRecord | null> {
    const key = `${contractAddress.toLowerCase()}:${chainKey}`
    const record = this.trustRecords.get(key)
    return record ? cloneTrustRecord(record) : null
  }

  async upsertTrustRecord(record: ContractTrustRecord): Promise<ContractTrustRecord> {
    const key = `${record.contractAddress.toLowerCase()}:${record.chainKey}`
    this.trustRecords.set(key, cloneTrustRecord(record))
    return cloneTrustRecord(record)
  }

  async deleteTrustRecord(contractAddress: string): Promise<boolean> {
    let deleted = false
    for (const key of this.trustRecords.keys()) {
      if (key.startsWith(`${contractAddress.toLowerCase()}:`)) {
        deleted = this.trustRecords.delete(key) || deleted
      }
    }
    return deleted
  }

  async listLoans(): Promise<Loan[]> {
    return [...this.loans.values()].map(cloneLoan).sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
  }

  async getLoan(id: string): Promise<Loan | null> {
    const loan = this.loans.get(id)
    return loan ? cloneLoan(loan) : null
  }

  async createLoan(loan: Loan): Promise<Loan> {
    this.loans.set(loan.id, cloneLoan(loan))
    return cloneLoan(loan)
  }

  async updateLoan(id: string, patch: Partial<Loan>): Promise<Loan | null> {
    const current = this.loans.get(id)
    if (!current) {
      return null
    }

    const updated: Loan = {
      ...current,
      ...patch,
      createdAt: patch.createdAt ? new Date(patch.createdAt) : current.createdAt,
      disbursedAt: patch.disbursedAt ? new Date(patch.disbursedAt) : current.disbursedAt,
      repaidAt: patch.repaidAt ? new Date(patch.repaidAt) : current.repaidAt,
      dueAt: patch.dueAt ? new Date(patch.dueAt) : current.dueAt
    }

    this.loans.set(id, cloneLoan(updated))
    return cloneLoan(updated)
  }

  async getCreditHistory(agentId: string): Promise<CreditHistory | null> {
    const history = this.creditHistory.get(agentId)
    return history ? cloneCreditHistory(history) : null
  }

  async upsertCreditHistory(history: CreditHistory): Promise<CreditHistory> {
    this.creditHistory.set(history.agentId, cloneCreditHistory(history))
    return cloneCreditHistory(history)
  }

  async listSkillExecutions(): Promise<SkillExecution[]> {
    return [...this.skillExecutions.values()]
      .map(cloneSkillExecution)
      .sort((left, right) => right.startedAt.getTime() - left.startedAt.getTime())
  }

  async getSkillExecution(id: string): Promise<SkillExecution | null> {
    const execution = this.skillExecutions.get(id)
    return execution ? cloneSkillExecution(execution) : null
  }

  async createSkillExecution(execution: SkillExecution): Promise<SkillExecution> {
    this.skillExecutions.set(execution.executionId, cloneSkillExecution(execution))
    return cloneSkillExecution(execution)
  }

  async updateSkillExecution(id: string, patch: Partial<SkillExecution>): Promise<SkillExecution | null> {
    const current = this.skillExecutions.get(id)
    if (!current) {
      return null
    }

    const updated: SkillExecution = {
      ...current,
      ...patch,
      input: patch.input ? { ...patch.input } : current.input,
      output: patch.output ? { ...patch.output } : current.output,
      startedAt: patch.startedAt ? new Date(patch.startedAt) : current.startedAt,
      completedAt: patch.completedAt ? new Date(patch.completedAt) : current.completedAt
    }

    this.skillExecutions.set(id, cloneSkillExecution(updated))
    return cloneSkillExecution(updated)
  }

  async listAlerts(): Promise<Alert[]> {
    return [...this.alerts.values()].map(cloneAlert).sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
  }

  async getAlert(id: string): Promise<Alert | null> {
    const alert = this.alerts.get(id)
    return alert ? cloneAlert(alert) : null
  }

  async createAlert(alert: Alert): Promise<Alert> {
    this.alerts.set(alert.id, cloneAlert(alert))
    return cloneAlert(alert)
  }

  async updateAlert(id: string, patch: Partial<Alert>): Promise<Alert | null> {
    const current = this.alerts.get(id)
    if (!current) {
      return null
    }

    const updated: Alert = {
      ...current,
      ...patch,
      metadata: patch.metadata ? { ...patch.metadata } : current.metadata,
      createdAt: patch.createdAt ? new Date(patch.createdAt) : current.createdAt
    }
    this.alerts.set(id, cloneAlert(updated))
    return cloneAlert(updated)
  }

  async listEvents(limit = 100): Promise<OrchestratorEvent[]> {
    return [...this.events.values()]
      .map(cloneEvent)
      .sort((left, right) => right.timestamp.getTime() - left.timestamp.getTime())
      .slice(0, limit)
  }

  async createEvent(event: OrchestratorEvent): Promise<OrchestratorEvent> {
    this.events.set(event.id || createId('evt'), cloneEvent(event))
    return cloneEvent(event)
  }
}

export function createMemoryStore(): ArbiterStore {
  return new MemoryStore()
}
