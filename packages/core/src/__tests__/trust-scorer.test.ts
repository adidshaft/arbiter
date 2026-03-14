import { afterEach, describe, expect, it, vi } from 'vitest'
import { scoreContractTrust } from '../trust-registry/scorer.js'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('trust scorer', () => {
  it('falls back deterministically when no key is usable', async () => {
    vi.stubEnv('OPENAI_API_KEY', '')

    const record = await scoreContractTrust({
      contractAddress: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
      chainKey: 'ETHEREUM'
    }, {
      now: new Date('2026-03-19T00:00:00.000Z')
    })

    expect(record.score).toBe('RED')
    expect(record.contractAddress).toBe('0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef')
    expect(record.id).toMatch(/^trust_/)
  })
})

