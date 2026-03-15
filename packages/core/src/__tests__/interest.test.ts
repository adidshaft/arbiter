import { describe, expect, it } from 'vitest'
import { adjustAmountForRisk, calculateInterestRate, calculateLoanTerms } from '../lending/interest.js'
import { defaultCreditHistory } from '../credit/scorer.js'

describe('interest calculations', () => {
  const history = {
    ...defaultCreditHistory('agent-1'),
    score: 780
  }

  it('returns null for red trust', () => {
    expect(calculateInterestRate('RED', history, 0.2)).toBeNull()
    expect(calculateLoanTerms(1000, 'RED', history, 0.2)).toBeNull()
  })

  it('reduces risk-adjusted amount and keeps rate above floor', () => {
    expect(adjustAmountForRisk(1000, 'GREEN')).toBe(1000)
    expect(adjustAmountForRisk(1000, 'YELLOW')).toBe(700)
    expect(adjustAmountForRisk(1000, 'UNKNOWN')).toBe(500)

    const rate = calculateInterestRate('GREEN', history, 0.9)
    expect(rate).not.toBeNull()
    expect(rate ?? 0).toBeGreaterThanOrEqual(0.0001)

    const terms = calculateLoanTerms(1000, 'YELLOW', history, 0.9)
    expect(terms).not.toBeNull()
    expect(terms?.approvedAmount).toBe(700)
    expect(terms?.interestAmount ?? 0).toBeGreaterThan(0)
    expect(terms?.totalRepayment ?? 0).toBeGreaterThan(terms?.approvedAmount ?? 0)
  })
})

