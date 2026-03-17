import type { AgentWallet, ChainKey } from '@arbiter/core'
import CopyButton from '../common/CopyButton'

interface AgentWalletTableProps {
  wallets: Partial<Record<ChainKey, AgentWallet>>
}

export default function AgentWalletTable({ wallets }: AgentWalletTableProps): JSX.Element {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <table className="min-w-full divide-y divide-white/10 text-sm">
        <thead className="bg-white/5 text-left text-xs uppercase tracking-[0.18em] text-sand/55">
          <tr>
            <th className="px-4 py-3">Chain</th>
            <th className="px-4 py-3">Address</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {Object.values(wallets).map((wallet) =>
            wallet ? (
              <tr key={wallet.chainKey}>
                <td className="px-4 py-3 font-medium text-sand">{wallet.chainKey}</td>
                <td className="px-4 py-3 arbiter-mono text-xs text-sand/75">{wallet.address}</td>
                <td className="px-4 py-3 text-right">
                  <CopyButton value={wallet.address} />
                </td>
              </tr>
            ) : null
          )}
        </tbody>
      </table>
    </div>
  )
}

