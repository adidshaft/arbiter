import { useQuery } from '@tanstack/react-query'
import { Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import AgentCard from '../components/agents/AgentCard'
import EventFeed from '../components/events/EventFeed'
import StatCard from '../components/common/StatCard'
import { useAgentBalances } from '../hooks/useAgentBalances'
import { useAgents } from '../hooks/useAgents'
import { apiFetch } from '../lib/api'
import type { SerializedOrchestratorEvent } from '../lib/types'

export default function FleetOverview(): JSX.Element {
  const agents = useAgents()
  const balances = useAgentBalances()
  const events = useQuery({
    queryKey: ['events'],
    queryFn: () => apiFetch<SerializedOrchestratorEvent[]>('/api/events')
  })

  const balanceByChain = (balances.data ?? []).reduce<Record<string, number>>((accumulator, balance) => {
    accumulator[balance.chainKey] = (accumulator[balance.chainKey] ?? 0) + Number(balance.usdtHuman)
    return accumulator
  }, {})

  const chartData = Object.entries(balanceByChain).map(([name, value]) => ({ name, value }))
  const totalFleetBalance = (balances.data ?? []).reduce((sum, balance) => sum + Number(balance.usdtHuman), 0)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-4">
        <StatCard label="Agents" value={(agents.data?.length ?? 0).toString()} />
        <StatCard label="Fleet USDT" value={`$${totalFleetBalance.toFixed(2)}`} tone="mint" />
        <StatCard label="Events" value={(events.data?.length ?? 0).toString()} />
        <StatCard label="Balances tracked" value={(balances.data?.length ?? 0).toString()} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr,0.7fr]">
        <div className="grid gap-4 lg:grid-cols-2">
          {(agents.data ?? []).map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              balances={(balances.data ?? []).filter((balance) => balance.agentId === agent.id)}
            />
          ))}
        </div>

        <div className="arbiter-card">
          <div className="arbiter-label">Chain breakdown</div>
          <h3 className="mt-2 text-lg font-semibold text-sand">USDT distribution</h3>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={96} paddingAngle={4} fill="#35f1a2" />
                <Tooltip formatter={(value) => `$${Number(value ?? 0).toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <EventFeed events={events.data ?? []} />
    </div>
  )
}
