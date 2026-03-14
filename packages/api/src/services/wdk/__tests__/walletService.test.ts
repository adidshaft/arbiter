import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.stubEnv('USE_MOCK_APIS', 'true')
vi.stubEnv('AGENT_ENCRYPTION_KEY', 'unit-test-encryption-key')

describe('walletService', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('provisions wallets and routes operations through the mock backend', async () => {
    const { createAgentWallet, getUsdtBalance, getWalletAddress, transferUsdt, bridgeUsdtCrossChain } = await import('../walletService')

    const seedPhrase = 'provision unit test seed phrase only for arbiter'
    const created = await createAgentWallet({
      agentId: 'agent-alpha',
      seedPhrase,
    })

    expect(created.mode).toBe('mock')
    expect(created.wallets).toHaveLength(6)

    const ethereumAddress = await getWalletAddress({
      encryptedSeed: created.encryptedSeed,
      chainKey: 'ethereum',
    })

    expect(ethereumAddress.startsWith('0x')).toBe(true)

    const startBalance = await getUsdtBalance({
      encryptedSeed: created.encryptedSeed,
      chainKey: 'ethereum',
    })

    const transferReceipt = await transferUsdt({
      encryptedSeed: created.encryptedSeed,
      chainKey: 'ethereum',
      recipient: created.wallets[1]?.address ?? ethereumAddress,
      amountRaw: 2_000_000n,
    })

    expect(transferReceipt.chainKey).toBe('ethereum')
    expect(transferReceipt.hash.startsWith('0x')).toBe(true)
    expect(await getUsdtBalance({
      encryptedSeed: created.encryptedSeed,
      chainKey: 'ethereum',
    })).toBe(startBalance - 2_000_000n)

    const bridgeReceipt = await bridgeUsdtCrossChain({
      encryptedSeed: created.encryptedSeed,
      chainKey: 'ethereum',
      targetChainKey: 'polygon',
      recipient: created.wallets[1]?.address ?? ethereumAddress,
      amountRaw: 1_000_000n,
    })

    expect(bridgeReceipt.targetChainKey).toBe('polygon')
    expect(bridgeReceipt.bridgeFee).toBeGreaterThan(0n)
  })
})
