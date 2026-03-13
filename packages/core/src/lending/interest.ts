import type { CreditHistory, TrustScore } from '../types/index.js'

export const BASE_RATE = 0.001
export const YELLOW_PREMIUM = 0.0005
export const CREDIT_BONUS_PER_10 = 0.0002
export const MAX_REDUCTION = 0.0005
export const UTILIZATION_THRESHOLD = 0.8
export const UTILIZATION_MULTIPLIER = 1.5
export const RATE_FLOOR = 0.0001

export interface LoanTerms {
  principal: number
  approvedAmount: number
  trustScore: TrustScore
  interestRate: number
  interestAmount: number
  totalRepayment: number
}

const clamp = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(value)) {
    return min
  }
  return Math.min(Math.max(value, min), max)
}

const roundMoney = (value: number): number => Math.round((value + Number.EPSILON) * 1_000_000) / 1_000_000

const trustPremium = (trustScore: TrustScore): number => {
  switch (trustScore) {
    case 'GREEN':
      return 0
    case 'YELLOW':
      return YELLOW_PREMIUM
    case 'UNKNOWN':
      return YELLOW_PREMIUM / 2
    case 'RED':
      return 0
  }
}

const computeCreditReduction = (creditHistory: CreditHistory): number => {
  const reduction = Math.floor(clamp(creditHistory.score, 0, 1000) / 10) * CREDIT_BONUS_PER_10
  return Math.min(reduction, MAX_REDUCTION)
}

export function calculateInterestRate(
  trustScore: TrustScore,
  creditHistory: CreditHistory,
  poolUtilization: number
): number | null {
  if (trustScore === 'RED') {
    return null
  }

  const utilization = clamp(poolUtilization, 0, 1)
  const baseRate = BASE_RATE + trustPremium(trustScore)
  const reducedRate = baseRate - computeCreditReduction(creditHistory)
  const adjustedRate = utilization > UTILIZATION_THRESHOLD ? reducedRate * UTILIZATION_MULTIPLIER : reducedRate

  return Math.max(roundMoney(adjustedRate), RATE_FLOOR)
}

export function adjustAmountForRisk(amount: number, trustScore: TrustScore): number {
  const factor = (() => {
    switch (trustScore) {
      case 'GREEN':
        return 1
      case 'YELLOW':
        return 0.7
      case 'UNKNOWN':
        return 0.5
      case 'RED':
        return 0
    }
  })()

  return roundMoney(amount * factor)
}

export function calculateLoanTerms(
  principal: number,
  trustScore: TrustScore,
  creditHistory: CreditHistory,
  poolUtilization: number
): LoanTerms | null {
  if (trustScore === 'RED') {
    return null
  }

  const approvedAmount = adjustAmountForRisk(principal, trustScore)
  const interestRate = calculateInterestRate(trustScore, creditHistory, poolUtilization)

  if (interestRate === null) {
    return null
  }

  const interestAmount = roundMoney(approvedAmount * interestRate)
  const totalRepayment = roundMoney(approvedAmount + interestAmount)

  return {
    principal: roundMoney(principal),
    approvedAmount,
    trustScore,
    interestRate,
    interestAmount,
    totalRepayment
  }
}

