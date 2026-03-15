import type { AgentSkill } from '../types/index.js'
import { SUPPORTED_CHAINS } from '../types/index.js'

export const SKILLS: readonly AgentSkill[] = [
  {
    skillId: 'rebalance-capital',
    name: 'Rebalance Capital',
    description: 'Shift idle treasury capacity toward the most active supported chain while respecting balance floors.',
    requiredUsdtBalance: 25,
    supportedChains: [
      'ETHEREUM',
      'POLYGON',
      'ARBITRUM',
      'SOLANA',
      'TON',
      'BITCOIN'
    ],
    estimatedDurationSecs: 45
  },
  {
    skillId: 'evaluate-contract-risk',
    name: 'Evaluate Contract Risk',
    description: 'Score a contract, capture reasons, and emit a compact lending risk recommendation.',
    requiredUsdtBalance: 0,
    supportedChains: ['ETHEREUM', 'POLYGON', 'ARBITRUM', 'SOLANA', 'TON', 'BITCOIN'],
    estimatedDurationSecs: 20
  },
  {
    skillId: 'originate-loan',
    name: 'Originate Loan',
    description: 'Create a loan request, match a lender, and move the flow toward disbursement.',
    requiredUsdtBalance: 50,
    supportedChains: ['ETHEREUM', 'POLYGON', 'ARBITRUM'],
    estimatedDurationSecs: 60
  },
  {
    skillId: 'bridge-usdt',
    name: 'Bridge USDT',
    description: 'Prepare a deterministic cross-chain bridge flow for supported EVM source chains.',
    requiredUsdtBalance: 75,
    supportedChains: ['ETHEREUM', 'POLYGON', 'ARBITRUM'],
    estimatedDurationSecs: 90
  },
  {
    skillId: 'recover-agent',
    name: 'Recover Agent',
    description: 'Pause unsafe agents, snapshot balances, and prepare the fleet for manual recovery.',
    requiredUsdtBalance: 0,
    supportedChains: [
      'ETHEREUM',
      'POLYGON',
      'ARBITRUM',
      'SOLANA',
      'TON',
      'BITCOIN'
    ],
    estimatedDurationSecs: 30
  }
] as const

export function getSkillById(skillId: string): AgentSkill | undefined {
  return SKILLS.find((skill) => skill.skillId === skillId)
}

export const SKILL_CHAINS = SUPPORTED_CHAINS

