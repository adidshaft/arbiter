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

      <div className="arbiter-card">
        <div className="arbiter-label">Agent control</div>
        <h2 className="mt-2 text-xl font-semibold text-sand">Create live agents and seed the fleet</h2>
        <form
          className="mt-5 grid gap-4 lg:grid-cols-[1.4fr,220px,auto]"
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
          <input className="arbiter-field" value={newAgentName} onChange={(event) => setNewAgentName(event.target.value)} placeholder="Agent name" />
          <select className="arbiter-field" value={newAgentRole} onChange={(event) => setNewAgentRole(event.target.value as typeof newAgentRole)}>
            <option value="lender">Lender</option>
            <option value="borrower">Borrower</option>
            <option value="executor">Executor</option>
            <option value="orchestrator">Orchestrator</option>
          </select>
          <button className="arbiter-button" type="submit" disabled={!newAgentName.trim() || agents.createAgent.isPending}>
            Create agent
          </button>
        </form>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-sand/55">
          {recommendedNames.map((entry) => (
            <button
              key={`${entry.role}:${entry.name}`}
              type="button"
              className="arbiter-badge"
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
