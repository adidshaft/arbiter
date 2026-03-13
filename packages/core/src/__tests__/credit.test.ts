import { describe, expect, it } from 'vitest'
import { calculateCreditScore, defaultCreditHistory, updateCreditHistory } from '../credit/scorer.js'

describe('credit scoring', () => {
  it('returns a neutral default score for new agents', () => {
    const history = defaultCreditHistory('agent-1')
    expect(history.score).toBe(500)
    expect(calculateCreditScore(history)).toBe(500)
  })

  it('improves with successful repayments and penalizes defaults', () => {
    const base = defaultCreditHistory('agent-2')
    const repaidOnce = updateCreditHistory(base, 'repaid', 100, 8)
    const repaidTwice = updateCreditHistory(repaidOnce, 'repaid', 100, 6)
    const defaulted = updateCreditHistory(repaidTwice, 'defaulted', 100, 0)

    expect(repaidOnce.score).toBeGreaterThan(base.score)
    expect(repaidTwice.score).toBeGreaterThan(repaidOnce.score)
    expect(defaulted.score).toBeLessThan(repaidTwice.score)
    expect(defaulted.totalLoans).toBe(3)
    expect(defaulted.totalBorrowed).toBe(300)
    expect(defaulted.totalRepaid).toBe(200)
  })
})

