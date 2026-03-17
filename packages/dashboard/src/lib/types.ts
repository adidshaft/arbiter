import type {
  Agent,
  AgentBalance,
  AgentConfig,
  AgentSkill,
  Alert,
  ChainKey,
  ContractTrustRecord,
  CreditHistory,
  Loan,
  LendingPool,
  LoanStatus,
  OrchestratorEvent,
  SkillExecution,
  TrustScore
} from '@arbiter/core'

export type SerializedAgentBalance = Omit<AgentBalance, 'updatedAt' | 'usdtRaw'> & {
  updatedAt: string
  usdtRaw: string
}

export type SerializedAgent = Omit<Agent, 'createdAt' | 'updatedAt'> & {
  createdAt: string
  updatedAt: string
  balances?: SerializedAgentBalance[]
}

export type SerializedCreditHistory = Omit<CreditHistory, 'lastUpdated'> & {
  lastUpdated: string
}

export type SerializedContractTrustRecord = Omit<ContractTrustRecord, 'scoredAt'> & {
  scoredAt: string
}

export type SerializedLoan = Omit<
  Loan,
  'createdAt' | 'dueAt' | 'disbursedAt' | 'repaidAt'
> & {
  createdAt: string
  dueAt: string
  disbursedAt?: string
  repaidAt?: string
}

export type SerializedLendingPool = LendingPool

export type SerializedAgentSkill = AgentSkill

export type SerializedSkillExecution = Omit<SkillExecution, 'startedAt' | 'completedAt'> & {
  startedAt: string
  completedAt?: string
}

export type SerializedAlert = Omit<Alert, 'createdAt'> & {
  createdAt: string
}

export type SerializedOrchestratorEvent = Omit<OrchestratorEvent, 'timestamp'> & {
  timestamp: string
}

export interface AgentDetailResponse extends SerializedAgent {
  creditHistory?: SerializedCreditHistory
  loans?: SerializedLoan[]
}

export interface HealthResponse {
  status: 'ok'
  mock: boolean
  chains: number
}

export interface AgentsResponse {
  agents: SerializedAgent[]
}

export interface LendingResponse {
  loans: SerializedLoan[]
  pool: SerializedLendingPool
}

export interface TrustResponse {
  records: SerializedContractTrustRecord[]
}

export interface SkillsResponse {
  skills: SerializedAgentSkill[]
  executions: SerializedSkillExecution[]
}

export interface AlertsResponse {
  alerts: SerializedAlert[]
}

export interface WebSocketEnvelope {
  type: OrchestratorEvent['type']
  payload: Record<string, unknown>
  timestamp: string
}

export interface RealtimeEvent extends WebSocketEnvelope {
  id: string
}

export interface RealtimeAlert extends SerializedAlert {
  source: 'api' | 'websocket'
}

export interface AgentBalanceAggregate {
  totalUsdt: number
  chainBreakdown: Partial<Record<ChainKey, number>>
}

export interface AgentLifetimeStats {
  totalLoans: number
  repaidLoans: number
  defaultedLoans: number
  totalBorrowed: number
  totalRepaid: number
  averageRepaymentDays: number
  score: number
}

export interface LoanRequestPayload {
  borrowerAgentId: string
  amount: number
  chainKey: ChainKey
  targetContract: string
  taskDescription: string
}

export interface LoanRepayPayload {
  agentId: string
}

export interface TrustScorePayload {
  contractAddress: string
  chainKey: ChainKey
  forceRefresh?: boolean
}

export interface SkillExecutionPayload {
  skillId: string
  agentId: string
  chainKey: ChainKey
  input: Record<string, unknown>
}

export interface AgentConfigFormState extends AgentConfig {
  allowedContractsText: string
  blockedContractsText: string
  preferredChainsText: string
}
