import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import AgentCard from '../components/agents/AgentCard'
import EventFeed from '../components/events/EventFeed'
import StatCard from '../components/common/StatCard'
import { useRealtimeFeed } from '../app/realtime'
import { useAgentBalances } from '../hooks/useAgentBalances'
import { useAgents } from '../hooks/useAgents'
import { apiFetch } from '../lib/api'
import type { SerializedOrchestratorEvent } from '../lib/types'

export default function FleetOverview(): JSX.Element {
  const agents = useAgents()
  const balances = useAgentBalances()
  const { events: realtimeEvents } = useRealtimeFeed()
  const [newAgentName, setNewAgentName] = useState('')
  const [newAgentRole, setNewAgentRole] = useState<'lender' | 'borrower' | 'executor' | 'orchestrator'>('borrower')
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
  const agentCount = agents.data?.length ?? 0

  useEffect(() => {
    if (!newAgentName && agentCount === 0) {
      setNewAgentName('Atlas Treasury')
      setNewAgentRole('lender')
    }
  }, [agentCount, newAgentName])

  const recommendedNames = useMemo(
    () => [
      { role: 'lender' as const, name: 'Atlas Treasury' },
      { role: 'borrower' as const, name: 'Nova Ops' },
      { role: 'executor' as const, name: 'Sentinel' }
    ],
    []
  )

  const mergedEvents = useMemo<SerializedOrchestratorEvent[]>(() => {
    const merged = new Map<string, SerializedOrchestratorEvent>()

    for (const event of events.data ?? []) {
      merged.set(event.id, event)
    }

    for (const event of realtimeEvents) {
      merged.set(event.id, {
        id: event.id,
        type: event.type,
        payload: event.payload,
        timestamp: event.timestamp
      })
    }

    return [...merged.values()].sort((left, right) => right.timestamp.localeCompare(left.timestamp))
  }, [events.data, realtimeEvents])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-4">
        <StatCard label="Agents" value={agentCount.toString()} />
        <StatCard label="Fleet USDT" value={`$${totalFleetBalance.toFixed(2)}`} tone="mint" />
        <StatCard label="Events" value={mergedEvents.length.toString()} />
        <StatCard label="Balances tracked" value={(balances.data?.length ?? 0).toString()} />
      </div>

      <div className="arbiter-card border-mint/10 bg-mint/5">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="flex-1">
            <div className="arbiter-label mb-3">Agent Provisioning</div>
            <h2 className="text-2xl font-bold tracking-tight text-sand">Create and seed live agents</h2>
            <p className="mt-2 text-sm text-sand/40">Deploy a new autonomous agent to the fleet with a specific role.</p>
            
            <form
              className="mt-8 flex flex-col sm:flex-row items-stretch gap-3"
              onSubmit={(event) => {
                event.preventDefault()
                if (!newAgentName.trim()) {
                  return
                }
                agents.createAgent.mutate({ name: newAgentName.trim(), role: newAgentRole }, {
                  onSuccess: () => {
                    setNewAgentName('')
                  }
                })
              }}
            >
              <div className="flex-1">
                <input className="arbiter-field h-12" value={newAgentName} onChange={(event) => setNewAgentName(event.target.value)} placeholder="Enter agent name..." />
              </div>
              <div className="w-full sm:w-48">
                <select className="arbiter-field h-12 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%23f5f1e8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_0.5rem_center] bg-[length:1.25em_1.25em] bg-no-repeat pr-10" value={newAgentRole} onChange={(event) => setNewAgentRole(event.target.value as typeof newAgentRole)}>
                  <option value="lender">Lender</option>
                  <option value="borrower">Borrower</option>
                  <option value="executor">Executor</option>
                  <option value="orchestrator">Orchestrator</option>
                </select>
              </div>
              <button className="arbiter-button h-12 px-8 min-w-[140px]" type="submit" disabled={!newAgentName.trim() || agents.createAgent.isPending}>
                {agents.createAgent.isPending ? 'Deploying...' : 'Deploy Agent'}
              </button>
            </form>
          </div>
          
          <div className="lg:w-48">
            <div className="arbiter-label mb-3 opacity-40">Templates</div>
            <div className="flex flex-wrap gap-2">
              {recommendedNames.map((entry) => (
                <button
                  key={`${entry.role}:${entry.name}`}
                  type="button"
                  className="arbiter-badge hover:bg-white/10 hover:text-sand transition-colors cursor-pointer"
                  onClick={() => {
                    setNewAgentName(entry.name)
                    setNewAgentRole(entry.role)
                  }}
                >
                  {entry.name}
                </button>
              ))}
            </div>
          </div>
        </div>
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

      <EventFeed events={mergedEvents} />
    </div>
  )
}
