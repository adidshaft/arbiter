export const SUPPORTED_CHAINS = {
  ETHEREUM: {
    id: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    wdkKey: 'ethereum',
    rpcEnvVar: 'ETH_RPC_URL',
    usdtAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    usdtDecimals: 6,
    explorer: 'https://etherscan.io/tx',
    isEvm: true
  },
  POLYGON: {
    id: 137,
    name: 'Polygon',
    symbol: 'MATIC',
    wdkKey: 'polygon',
    rpcEnvVar: 'POLYGON_RPC_URL',
    usdtAddress: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    usdtDecimals: 6,
    explorer: 'https://polygonscan.com/tx',
    isEvm: true
  },
  ARBITRUM: {
    id: 42161,
    name: 'Arbitrum',
    symbol: 'ETH',
    wdkKey: 'arbitrum',
    rpcEnvVar: 'ARBITRUM_RPC_URL',
    usdtAddress: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    usdtDecimals: 6,
    explorer: 'https://arbiscan.io/tx',
    isEvm: true
  },
  SOLANA: {
    id: 900,
    name: 'Solana',
    symbol: 'SOL',
    wdkKey: 'solana',
    rpcEnvVar: 'SOLANA_RPC_URL',
    usdtAddress: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    usdtDecimals: 6,
    explorer: 'https://solscan.io/tx',
    isEvm: false
  },
  TON: {
    id: 1100,
    name: 'TON',
    symbol: 'TON',
    wdkKey: 'ton',
    rpcEnvVar: 'TON_RPC_URL',
    usdtAddress: 'EQCajaUU1XXSAjTD-xOV7pE49fGtg4q8kF3ELCOxj5Rq_eYZ',
    usdtDecimals: 6,
    explorer: 'https://tonscan.org/tx',
    isEvm: false
  },
  BITCOIN: {
    id: 0,
    name: 'Bitcoin',
    symbol: 'BTC',
    wdkKey: 'bitcoin',
    rpcEnvVar: null,
    usdtAddress: null,
    usdtDecimals: 8,
    explorer: 'https://blockstream.info/tx',
    isEvm: false
  }
} as const

export type ChainKey = keyof typeof SUPPORTED_CHAINS
export type NetworkMode = 'mainnet' | 'testnet'
export type AgentRole = 'lender' | 'borrower' | 'executor' | 'orchestrator'
export type AgentStatus = 'idle' | 'executing' | 'lending' | 'borrowing' | 'paused'
export type TrustScore = 'GREEN' | 'YELLOW' | 'RED' | 'UNKNOWN'
export type LoanStatus =
  | 'requested'
  | 'trust_checking'
  | 'approved'
  | 'rejected'
  | 'disbursed'
  | 'executing'
  | 'repaying'
  | 'repaid'
  | 'defaulted'

export interface AgentConfig {
  maxTransactionSize: number
  dailySpendingCap: number
  lendingOptIn: boolean
  minBalanceFloor: number
  preferredChains: ChainKey[]
  allowedContracts: string[]
  blockedContracts: string[]
}

export interface AgentWallet {
  chainKey: ChainKey
  address: string
}

export interface Agent {
  id: string
  name: string
  role: AgentRole
  status: AgentStatus
  config: AgentConfig
  creditScore: number
  wallets: Partial<Record<ChainKey, AgentWallet>>
  createdAt: Date
  updatedAt: Date
}

export interface AgentBalance {
  agentId: string
  chainKey: ChainKey
  address: string
  usdtHuman: string
  usdtRaw: bigint
  nativeHuman: string
  updatedAt: Date
}

export interface ContractTrustRecord {
  id: string
  contractAddress: string
  chainKey: ChainKey
  score: TrustScore
  confidence: number
  reasons: string[]
  rawAnalysis: string
  isProxy: boolean
  contractAge: number
  lastVolumeUsd: number
  hasVerifiedSource: boolean
  scoredAt: Date
  refreshTrigger?: string
}

export interface ScoringRequest {
  contractAddress: string
  chainKey: ChainKey
  forceRefresh?: boolean
}

export interface LoanRequest {
  id: string
  borrowerAgentId: string
  amount: number
  chainKey: ChainKey
  targetContract: string
  taskDescription: string
  requestedAt: Date
}

export interface Loan {
  id: string
  requestId: string
  lenderAgentId: string
  borrowerAgentId: string
  principal: number
  interestRate: number
  interestAmount: number
  totalRepayment: number
  chainKey: ChainKey
  targetContract: string
  trustScore: TrustScore
  status: LoanStatus
  lenderTxHash?: string
  borrowerTxHash?: string
  bridgeTxHash?: string
  isCrossChain: boolean
  lenderChainKey?: ChainKey
  createdAt: Date
  disbursedAt?: Date
  repaidAt?: Date
  dueAt: Date
}

export interface LendingPool {
  totalCapital: number
  availableCapital: number
  activeLoansCount: number
  totalLentOut: number
  utilizationRate: number
  chainBreakdown: Partial<Record<ChainKey, number>>
}

export interface CreditHistory {
  agentId: string
  totalLoans: number
  successfulRepayments: number
  defaultedLoans: number
  totalBorrowed: number
  totalRepaid: number
  averageRepaymentDays: number
  score: number
  lastUpdated: Date
}

export interface AgentSkill {
  skillId: string
  name: string
  description: string
  requiredUsdtBalance: number
  supportedChains: ChainKey[]
  estimatedDurationSecs: number
}

export interface SkillExecution {
  executionId: string
  skillId: string
  agentId: string
  chainKey: ChainKey
  status: 'running' | 'success' | 'failed'
  input: Record<string, unknown>
  output?: Record<string, unknown>
  error?: string
  txHash?: string
  startedAt: Date
  completedAt?: Date
}

export interface Alert {
  id: string
  type: 'red_contract_unknown' | 'loan_default_risk' | 'low_balance' | 'bridge_delayed' | 'skill_failed'
  severity: 'info' | 'warning' | 'critical'
  agentId: string
  message: string
  metadata?: Record<string, unknown>
  dismissed: boolean
  createdAt: Date
}

export interface OrchestratorEvent {
  id: string
  type:
    | 'loan_requested'
    | 'loan_approved'
    | 'loan_rejected'
    | 'loan_disbursed'
    | 'loan_repaid'
    | 'trust_scored'
    | 'alert_created'
    | 'agent_paused'
    | 'bridge_initiated'
    | 'skill_executed'
    | 'kill_switch'
  payload: Record<string, unknown>
  timestamp: Date
}
