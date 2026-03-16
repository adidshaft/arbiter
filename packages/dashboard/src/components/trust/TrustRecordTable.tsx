import type { SerializedContractTrustRecord } from '../../lib/types'
import { formatAddress, formatCurrency, formatDate } from '../../lib/formatters'
import TrustScoreBadge from './TrustScoreBadge'

interface TrustRecordTableProps {
  records: SerializedContractTrustRecord[]
  onDelete: (contractAddress: string) => void
}

export default function TrustRecordTable({ records, onDelete }: TrustRecordTableProps): JSX.Element {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <table className="min-w-full divide-y divide-white/10 text-sm">
        <thead className="bg-white/5 text-left text-xs uppercase tracking-[0.18em] text-sand/55">
          <tr>
            <th className="px-4 py-3">Contract</th>
            <th className="px-4 py-3">Chain</th>
            <th className="px-4 py-3">Score</th>
            <th className="px-4 py-3">Volume</th>
            <th className="px-4 py-3">Scored</th>
            <th className="px-4 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {records.map((record) => (
            <tr key={record.id}>
              <td className="px-4 py-3 arbiter-mono text-xs text-sand">{formatAddress(record.contractAddress)}</td>
              <td className="px-4 py-3 text-sand/70">{record.chainKey}</td>
              <td className="px-4 py-3">
                <TrustScoreBadge score={record.score} />
              </td>
              <td className="px-4 py-3 text-sand/70">{formatCurrency(record.lastVolumeUsd)}</td>
              <td className="px-4 py-3 text-sand/60">{formatDate(record.scoredAt)}</td>
              <td className="px-4 py-3 text-right">
                <button type="button" className="arbiter-button-secondary text-xs" onClick={() => onDelete(record.contractAddress)}>
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

