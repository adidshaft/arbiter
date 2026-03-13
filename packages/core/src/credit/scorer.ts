import type { CreditHistory } from '../types/index.js'

export type CreditOutcome = 'repaid' | 'defaulted'

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max)

const round = (value: number): number => Math.round(value)

export function calculateCreditScore(history: CreditHistory): number {
  if (history.totalLoans === 0) {
    return 500
  }

  const totalLoans = Math.max(history.totalLoans, 1)
  const repaymentRate = history.successfulRepayments / totalLoans
  const defaultRate = history.defaultedLoans / totalLoans
  const repaymentCoverage = history.totalBorrowed > 0 ? history.totalRepaid / history.totalBorrowed : 0
  const repaymentSpeed = 1 - clamp(history.averageRepaymentDays / 30, 0, 1)
  const activityBonus = clamp(totalLoans * 3, 0, 60)

  const score =
    500 +
    repaymentRate * 260 +
    repaymentCoverage * 130 +
    repaymentSpeed * 100 +
    activityBonus -
    defaultRate * 260

  return clamp(round(score), 0, 1000)
}

export function defaultCreditHistory(agentId: string): CreditHistory {
  const now = new Date()
  return {
    agentId,
    totalLoans: 0,
    successfulRepayments: 0,
    defaultedLoans: 0,
    totalBorrowed: 0,
    totalRepaid: 0,
    averageRepaymentDays: 0,
    score: 500,
    lastUpdated: now
  }
}

export function updateCreditHistory(
  existing: CreditHistory,
  outcome: CreditOutcome,
  loanAmount: number,
  daysToRepay: number
): CreditHistory {
  const totalLoans = existing.totalLoans + 1
  const successfulRepayments = existing.successfulRepayments + (outcome === 'repaid' ? 1 : 0)
  const defaultedLoans = existing.defaultedLoans + (outcome === 'defaulted' ? 1 : 0)
  const totalBorrowed = existing.totalBorrowed + loanAmount
  const totalRepaid = existing.totalRepaid + (outcome === 'repaid' ? loanAmount : 0)
  const safeDays = Math.max(daysToRepay, 0)
  const weightedAverage =
    existing.totalLoans === 0
      ? safeDays
      : (existing.averageRepaymentDays * existing.totalLoans + safeDays) / totalLoans

  const updated: CreditHistory = {
    agentId: existing.agentId,
    totalLoans,
    successfulRepayments,
    defaultedLoans,
    totalBorrowed,
    totalRepaid,
    averageRepaymentDays: Number(weightedAverage.toFixed(2)),
    score: 0,
    lastUpdated: new Date()
  }

  updated.score = calculateCreditScore(updated)
  return updated
}

