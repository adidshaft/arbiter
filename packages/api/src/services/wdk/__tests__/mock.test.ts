import { describe, expect, it } from 'vitest'

import {
  bridgeUsdt,
  createWallet,
  getAddress,
  getAllWallets,
  getUsdtBalance,
  transferUsdt,
} from '../mock'

describe('wdk mock', () => {
  it('creates deterministic wallets and keeps balances stateful', async () => {
    const seedPhrase = 'mock seed phrase for arbiter unit tests only'
    const wallets = await createWallet({
      seedPhrase,
      chainKeys: ['ethereum', 'polygon', 'solana', 'ton', 'bitcoin'],
    })

    expect(wallets).toHaveLength(5)
    expect(wallets[0]?.address.startsWith('0x')).toBe(true)
    expect(await getAddress({ seedPhrase, chainKey: 'ethereum' })).toBe(wallets[0]?.address)
    expect(await getUsdtBalance({ seedPhrase, chainKey: 'polygon' })).toBe(wallets[1]?.usdtRaw)

    const senderBalance = await getUsdtBalance({ seedPhrase, chainKey: 'ethereum' })
    const transferReceipt = await transferUsdt({
      seedPhrase,
      chainKey: 'ethereum',
      recipient: wallets[1]?.address ?? '',
      amountRaw: 1_000_000n,
    })

    expect(transferReceipt.hash.startsWith('0x')).toBe(true)
    expect(await getUsdtBalance({ seedPhrase, chainKey: 'ethereum' })).toBe(senderBalance - 1_000_000n)

    const bridgeReceipt = await bridgeUsdt({
      seedPhrase,
      chainKey: 'ethereum',
      targetChainKey: 'polygon',
      recipient: wallets[1]?.address ?? '',
      amountRaw: 500_000n,
    })

    expect(bridgeReceipt.bridgeFee).toBeGreaterThan(0n)
    expect(await getUsdtBalance({ seedPhrase, chainKey: 'ethereum' })).toBe(senderBalance - 1_500_000n)
    expect(await getAllWallets({ seedPhrase })).toHaveLength(6)
  })
})
