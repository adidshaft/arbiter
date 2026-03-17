import type { Alert, OrchestratorEvent } from '@arbiter/core'
import { formatAddress, formatChain, formatCurrency, formatNumber } from './formatters'
import { CHAIN_METADATA } from './constants'

const stringValue = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined)
const numberValue = (value: unknown): number | undefined => (typeof value === 'number' ? value : undefined)

function chainFromPayload(value: unknown): string {
  const maybeChain = stringValue(value)
  if (maybeChain && maybeChain in CHAIN_METADATA) {
    return formatChain(maybeChain as keyof typeof CHAIN_METADATA)
  }
  return 'Unknown chain'
}

function amountFromPayload(value: unknown): string {
  const maybeAmount = numberValue(value)
  return typeof maybeAmount === 'number' ? formatCurrency(maybeAmount) : 'an amount'
}

export function humanizeEvent(event: OrchestratorEvent): string {
  const borrower = stringValue(event.payload.borrowerName) ?? stringValue(event.payload.borrowerAgentId) ?? 'Borrower'
  const lender = stringValue(event.payload.lenderName) ?? stringValue(event.payload.lenderAgentId) ?? 'Lender'
  const chain = chainFromPayload(event.payload.chainKey)
  const contractAddress = stringValue(event.payload.contractAddress)

  switch (event.type) {
    case 'loan_requested':
      return `${borrower} requested ${amountFromPayload(event.payload.amount)} on ${chain}`
    case 'loan_approved':
      return `${lender} approved ${amountFromPayload(event.payload.amount)} for ${borrower}`
    case 'loan_rejected':
      return `${borrower}'s request was rejected after trust review`
    case 'loan_disbursed':
      return `${amountFromPayload(event.payload.amount)} disbursed to ${borrower} on ${chain}`
    case 'loan_repaid':
      return `${borrower} repaid ${amountFromPayload(event.payload.amount)}`
    case 'trust_scored':
      return `${contractAddress ? formatAddress(contractAddress) : 'A contract'} scored ${stringValue(event.payload.score) ?? 'UNKNOWN'} on ${chain}`
    case 'alert_created':
      return stringValue(event.payload.message) ?? 'Alert created'
    case 'agent_paused':
      return `${borrower} was paused`
    case 'bridge_initiated':
      return `${amountFromPayload(event.payload.amount)} bridge started toward ${chain}`
    case 'skill_executed':
      return `${stringValue(event.payload.skillName) ?? 'Skill'} ${stringValue(event.payload.status) ?? 'executed'} on ${borrower}`
    case 'kill_switch':
      return 'Kill switch engaged across all agents'
    default:
      return 'New event received'
  }
}

export function humanizeAlert(alert: Alert): string {
  switch (alert.type) {
    case 'red_contract_unknown':
      return `Unknown contract on ${formatChain((alert.metadata?.chainKey as keyof typeof CHAIN_METADATA) ?? 'ETHEREUM')}`
    case 'loan_default_risk':
      return `Loan default risk detected for ${alert.agentId}`
    case 'low_balance':
      return `Low balance warning for ${alert.agentId}`
    case 'bridge_delayed':
      return `Bridge is delayed`
    case 'skill_failed':
      return `Skill failed for ${alert.agentId}`
    default:
      return formatNumber(0)
  }
}
