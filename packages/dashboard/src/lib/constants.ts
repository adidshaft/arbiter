import type { ChainKey, LoanStatus, TrustScore } from '@arbiter/core'

export const CHAIN_METADATA: Record<
  ChainKey,
  {
    id: number
    name: string
    symbol: string
    wdkKey: string
    explorer: string
    isEvm: boolean
    accent: string
  }
> = {
  ETHEREUM: {
    id: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    wdkKey: 'ethereum',
    explorer: 'https://etherscan.io/tx',
    isEvm: true,
    accent: '#8be9c4'
  },
  POLYGON: {
    id: 137,
    name: 'Polygon',
    symbol: 'MATIC',
    wdkKey: 'polygon',
    explorer: 'https://polygonscan.com/tx',
    isEvm: true,
    accent: '#a46cff'
  },
  ARBITRUM: {
    id: 42161,
    name: 'Arbitrum',
    symbol: 'ETH',
    wdkKey: 'arbitrum',
    explorer: 'https://arbiscan.io/tx',
    isEvm: true,
    accent: '#6dd6ff'
  },
  SOLANA: {
    id: 900,
    name: 'Solana',
    symbol: 'SOL',
    wdkKey: 'solana',
    explorer: 'https://solscan.io/tx',
    isEvm: false,
    accent: '#60f1a9'
  },
  TON: {
    id: 1100,
    name: 'TON',
    symbol: 'TON',
    wdkKey: 'ton',
    explorer: 'https://tonscan.org/tx',
    isEvm: false,
    accent: '#7bb2ff'
  },
  BITCOIN: {
    id: 0,
    name: 'Bitcoin',
    symbol: 'BTC',
    wdkKey: 'bitcoin',
    explorer: 'https://blockstream.info/tx',
    isEvm: false,
    accent: '#ffb56b'
  }
}

export const CHAIN_ORDER: ChainKey[] = ['ETHEREUM', 'POLYGON', 'ARBITRUM', 'SOLANA', 'TON', 'BITCOIN']

export const TRUST_SCORE_STYLES: Record<TrustScore, { label: string; className: string }> = {
  GREEN: { label: 'Green', className: 'border-mint/30 bg-mint/10 text-mint' },
  YELLOW: { label: 'Yellow', className: 'border-yellow-400/30 bg-yellow-400/10 text-yellow-200' },
  RED: { label: 'Red', className: 'border-red-400/30 bg-red-400/10 text-red-200' },
  UNKNOWN: { label: 'Unknown', className: 'border-white/15 bg-white/5 text-sand/75' }
}

export const LOAN_STATUS_STYLES: Record<LoanStatus, { label: string; className: string }> = {
  requested: { label: 'Requested', className: 'border-white/15 bg-white/5 text-sand/75' },
  trust_checking: { label: 'Trust check', className: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-100' },
  approved: { label: 'Approved', className: 'border-mint/30 bg-mint/10 text-mint' },
  rejected: { label: 'Rejected', className: 'border-red-400/30 bg-red-400/10 text-red-200' },
  disbursed: { label: 'Disbursed', className: 'border-green-400/30 bg-green-400/10 text-green-200' },
  executing: { label: 'Executing', className: 'border-amber-400/30 bg-amber-400/10 text-amber-100' },
  repaying: { label: 'Repaying', className: 'border-violet-400/30 bg-violet-400/10 text-violet-100' },
  repaid: { label: 'Repaid', className: 'border-mint/30 bg-mint/10 text-mint' },
  defaulted: { label: 'Defaulted', className: 'border-red-400/30 bg-red-400/10 text-red-200' }
}

export const AGENT_STATUS_STYLES: Record<
  'idle' | 'executing' | 'lending' | 'borrowing' | 'paused',
  { label: string; className: string }
> = {
  idle: { label: 'Idle', className: 'border-white/15 bg-white/5 text-sand/75' },
  executing: { label: 'Executing', className: 'border-amber-400/30 bg-amber-400/10 text-amber-100' },
  lending: { label: 'Lending', className: 'border-mint/30 bg-mint/10 text-mint' },
  borrowing: { label: 'Borrowing', className: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-100' },
  paused: { label: 'Paused', className: 'border-red-400/30 bg-red-400/10 text-red-200' }
}
