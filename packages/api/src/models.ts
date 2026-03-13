import type {
  Agent,
  AgentBalance,
  Alert,
  ContractTrustRecord,
  CreditHistory,
  Loan,
  OrchestratorEvent,
  SkillExecution
} from '@arbiter/core'

export interface AgentRecord extends Agent {
  encryptedSeed: string
}

export interface ArbiterStore {
  readonly mode: 'memory' | 'supabase'
  reset(): Promise<void>
  listAgents(): Promise<AgentRecord[]>
  getAgent(id: string): Promise<AgentRecord | null>
  createAgent(agent: AgentRecord): Promise<AgentRecord>
  updateAgent(id: string, patch: Partial<AgentRecord>): Promise<AgentRecord | null>
  deleteAgent(id: string): Promise<boolean>
  pauseAllAgents(): Promise<AgentRecord[]>
  listBalances(): Promise<AgentBalance[]>
  listBalancesByAgent(agentId: string): Promise<AgentBalance[]>
  upsertBalance(balance: AgentBalance): Promise<AgentBalance>
  upsertBalances(balances: AgentBalance[]): Promise<AgentBalance[]>
  deleteBalancesForAgent(agentId: string): Promise<void>
  listTrustRecords(): Promise<ContractTrustRecord[]>
  findTrustRecord(contractAddress: string, chainKey: ContractTrustRecord['chainKey']): Promise<ContractTrustRecord | null>
  upsertTrustRecord(record: ContractTrustRecord): Promise<ContractTrustRecord>
  deleteTrustRecord(contractAddress: string): Promise<boolean>
  listLoans(): Promise<Loan[]>
  getLoan(id: string): Promise<Loan | null>
  createLoan(loan: Loan): Promise<Loan>
  updateLoan(id: string, patch: Partial<Loan>): Promise<Loan | null>
  getCreditHistory(agentId: string): Promise<CreditHistory | null>
  upsertCreditHistory(history: CreditHistory): Promise<CreditHistory>
  listSkillExecutions(): Promise<SkillExecution[]>
  getSkillExecution(id: string): Promise<SkillExecution | null>
  createSkillExecution(execution: SkillExecution): Promise<SkillExecution>
  updateSkillExecution(id: string, patch: Partial<SkillExecution>): Promise<SkillExecution | null>
  listAlerts(): Promise<Alert[]>
  getAlert(id: string): Promise<Alert | null>
  createAlert(alert: Alert): Promise<Alert>
  updateAlert(id: string, patch: Partial<Alert>): Promise<Alert | null>
  listEvents(limit?: number): Promise<OrchestratorEvent[]>
  createEvent(event: OrchestratorEvent): Promise<OrchestratorEvent>
}

