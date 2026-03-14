import { describe, expect, it } from 'vitest'
import { shouldRefresh } from '../trust-registry/shouldRefresh.js'
import type { ContractTrustRecord } from '../types/index.js'

const makeRecord = (overrides: Partial<ContractTrustRecord> = {}): ContractTrustRecord => ({
  id: 'trust_test',
  contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
  chainKey: 'ETHEREUM',
  score: 'GREEN',
  confidence: 0.9,
  reasons: ['ok'],
  rawAnalysis: 'ok',
  isProxy: false,
  contractAge: 120,
  lastVolumeUsd: 100,
  hasVerifiedSource: true,
  scoredAt: new Date('2026-03-19T00:00:00.000Z'),
  ...overrides
})

describe('trust refresh logic', () => {
  it('refreshes stale records after 24h', () => {
    const record = makeRecord({ scoredAt: new Date('2026-03-17T23:00:00.000Z') })
    expect(
      shouldRefresh(record, { now: new Date('2026-03-19T00:00:00.000Z') })
    ).toBe(true)
  })

  it('refreshes unverified records after 6h', () => {
    const record = makeRecord({
      hasVerifiedSource: false,
      scoredAt: new Date('2026-03-18T16:00:00.000Z')
    })
    expect(
      shouldRefresh(record, { now: new Date('2026-03-19T00:30:00.000Z') })
    ).toBe(true)
  })

  it('refreshes on volume spikes', () => {
    const record = makeRecord()
    expect(
      shouldRefresh(record, {
        now: new Date('2026-03-19T00:30:00.000Z'),
        currentVolumeUsd: 350
      })
    ).toBe(true)
  })

  it('keeps fresh verified records', () => {
    const record = makeRecord()
    expect(
      shouldRefresh(record, {
        now: new Date('2026-03-19T01:00:00.000Z'),
        currentVolumeUsd: 200
      })
    ).toBe(false)
  })
})

