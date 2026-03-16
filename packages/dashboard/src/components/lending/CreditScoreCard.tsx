import type { SerializedCreditHistory } from '../../lib/types'
import StatCard from '../common/StatCard'
import { formatCurrency } from '../../lib/formatters'

interface CreditScoreCardProps {
  history: SerializedCreditHistory
}

export default function CreditScoreCard({ history }: CreditScoreCardProps): JSX.Element {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <StatCard label="Score" value={history.score.toString()} tone={history.score > 700 ? 'mint' : history.score > 550 ? 'amber' : 'red'} />
      <StatCard label="Total loans" value={history.totalLoans.toString()} />
      <StatCard label="Borrowed" value={formatCurrency(history.totalBorrowed)} />
      <StatCard label="Repaid" value={formatCurrency(history.totalRepaid)} />
    </div>
  )
}

