import type { SerializedLendingPool } from '../../lib/types'
import StatCard from '../common/StatCard'
import { formatCurrency, formatPercent } from '../../lib/formatters'

interface PoolStatsProps {
  pool: SerializedLendingPool
}

export default function PoolStats({ pool }: PoolStatsProps): JSX.Element {
  return (
    <div className="grid gap-4 lg:grid-cols-4">
      <StatCard label="Total capital" value={formatCurrency(pool.totalCapital)} />
      <StatCard label="Available capital" value={formatCurrency(pool.availableCapital)} tone="mint" />
      <StatCard label="Lent out" value={formatCurrency(pool.totalLentOut)} />
      <StatCard label="Utilization" value={formatPercent(pool.utilizationRate)} tone={pool.utilizationRate > 0.7 ? 'amber' : 'default'} />
    </div>
  )
}

