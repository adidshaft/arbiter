import type { SerializedLoan } from '../../lib/types'
import { getLoanStatusStyle, formatAddress, formatDate, formatCurrency } from '../../lib/formatters'

interface LoanTableProps {
  loans: SerializedLoan[]
  isRepaying?: boolean
  repayingLoanId?: string
  onRepay?: (loanId: string) => void
}

export default function LoanTable({ loans, isRepaying = false, repayingLoanId, onRepay }: LoanTableProps): JSX.Element {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <table className="min-w-full divide-y divide-white/10 text-sm">
        <thead className="bg-white/5 text-left text-xs uppercase tracking-[0.18em] text-sand/55">
          <tr>
            <th className="px-4 py-3">Loan</th>
            <th className="px-4 py-3">Borrower</th>
            <th className="px-4 py-3">Trust</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Due</th>
            <th className="px-4 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {loans.map((loan) => {
            const status = getLoanStatusStyle(loan.status)
            const canRepay = loan.status === 'disbursed' || loan.status === 'executing' || loan.status === 'repaying'
            return (
              <tr key={loan.id}>
                <td className="px-4 py-3">
                  <div className="arbiter-mono text-sand">{formatCurrency(loan.principal)}</div>
                  <div className="text-xs text-sand/55">{formatAddress(loan.targetContract)}</div>
                </td>
                <td className="px-4 py-3 text-sand/75">{loan.borrowerAgentId}</td>
                <td className="px-4 py-3 text-sand/75">{loan.trustScore}</td>
                <td className="px-4 py-3">
                  <span className={`arbiter-badge ${status.className}`}>{status.label}</span>
                </td>
                <td className="px-4 py-3 text-sand/60">{formatDate(loan.dueAt)}</td>
                <td className="px-4 py-3 text-right">
                  {onRepay && canRepay ? (
                    <button
                      className="arbiter-button-secondary text-xs"
                      type="button"
                      disabled={isRepaying}
                      onClick={() => onRepay(loan.id)}
                    >
                      {isRepaying && repayingLoanId === loan.id ? 'Repaying...' : 'Repay'}
                    </button>
                  ) : null}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
