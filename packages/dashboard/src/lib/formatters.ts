import type { AgentSkill, Alert, ChainKey, ContractTrustRecord, Loan, LoanStatus, SkillExecution, TrustScore } from '@arbiter/core'
import { CHAIN_METADATA, LOAN_STATUS_STYLES, TRUST_SCORE_STYLES } from './constants'

const formatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })

export function formatNumber(value: number): string {
  return formatter.format(value)
}

export function formatCurrency(value: number): string {
  return `$${formatNumber(value)}`
}

export function formatPercent(value: number): string {
  return `${formatNumber(value * 100)}%`
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value))
}

export function formatAddress(address: string): string {
  if (address.length <= 12) {
    return address
  }
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

export function formatTxHash(hash: string): string {
  if (hash.length <= 12) {
    return hash
  }
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`
}

export function formatChain(chainKey: ChainKey): string {
  return CHAIN_METADATA[chainKey].name
}

export function getExplorerTxUrl(chainKey: ChainKey, hash: string): string {
  return CHAIN_METADATA[chainKey].explorerTxTemplate.replace('{hash}', hash)
}

export function getTrustScoreStyle(score: TrustScore): { label: string; className: string } {
  return TRUST_SCORE_STYLES[score]
}

export function getLoanStatusStyle(status: LoanStatus): { label: string; className: string } {
  return LOAN_STATUS_STYLES[status]
}

export function formatLoanTitle(loan: Loan): string {
  return `${loan.principal.toFixed(2)} USDT on ${formatChain(loan.chainKey)}`
}

export function formatTrustReasonList(record: ContractTrustRecord): string {
  return record.reasons.join(' · ')
}

export function formatSkillChains(skill: AgentSkill): string {
  return skill.supportedChains.map(formatChain).join(', ')
}

export function formatSkillRun(execution: SkillExecution): string {
  return `${execution.skillId} · ${execution.status}`
}

export function formatAlertType(alert: Alert): string {
  return alert.type.replaceAll('_', ' ')
}

export function formatTrustBadge(score: TrustScore): string {
  return getTrustScoreStyle(score).label
}
