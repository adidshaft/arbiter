import { describe, expect, it, vi } from 'vitest'

vi.stubEnv('AGENT_ENCRYPTION_KEY', 'unit-test-encryption-key')

describe('wdk encryption', () => {
  it('encrypts and decrypts a seed phrase', async () => {
    const { decryptSeedPhrase, encryptSeedPhrase } = await import('../encryption')
    const seedPhrase = 'test seed phrase for arbiter wdk adapter'

    const encrypted = encryptSeedPhrase(seedPhrase)

    expect(encrypted).toContain(':')
    expect(decryptSeedPhrase(encrypted)).toBe(seedPhrase)
  })
})
