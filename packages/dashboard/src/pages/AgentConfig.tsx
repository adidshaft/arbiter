import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import AgentConfigForm from '../components/agents/AgentConfigForm'
import AgentWalletTable from '../components/agents/AgentWalletTable'
import CreditScoreCard from '../components/lending/CreditScoreCard'
import { useAgentBalances } from '../hooks/useAgentBalances'
import { useAgents } from '../hooks/useAgents'
import { useLending } from '../hooks/useLending'

export default function AgentConfig(): JSX.Element {
  const { id = '' } = useParams()
  const agents = useAgents()
  const balances = useAgentBalances(id)
  const lending = useLending([id])

  const agent = useMemo(() => (agents.data ?? []).find((entry) => entry.id === id), [agents.data, id])
  const credit = lending.credits[0]?.data
  const loanHistory = (lending.loans.data ?? []).filter((loan) => loan.borrowerAgentId === id || loan.lenderAgentId === id)

  if (!agent) {
    return <div className="arbiter-card text-sm text-sand/60">Agent not found.</div>
  }

  const chartData = (balances.data ?? []).map((balance) => ({
    chain: balance.chainKey,
    usdt: Number(balance.usdtHuman)
  }))

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <div className="arbiter-card">
          <div className="arbiter-label">Wallets</div>
          <h2 className="mt-2 text-xl font-semibold text-sand">{agent.name}</h2>
          <div className="mt-5">
            <AgentWalletTable wallets={agent.wallets} />
          </div>
        </div>

        <div className="arbiter-card">
          <div className="arbiter-label">Actions</div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button className="arbiter-button" type="button" onClick={() => agents.updateStatus.mutate({ id, status: 'paused' })}>
              Pause agent
            </button>
            <button className="arbiter-button-secondary" type="button" onClick={() => agents.updateStatus.mutate({ id, status: 'idle' })}>
              Resume agent
            </button>
            <button className="arbiter-button-secondary" type="button" onClick={() => agents.refreshBalances.mutate(id)}>
              Refresh balances
            </button>
          </div>
        </div>
      </div>

      <div className="arbiter-card">
        <div className="arbiter-label">Configuration</div>
        <div className="mt-4">
          <AgentConfigForm agent={agent} onSubmit={(config) => agents.updateConfig.mutate({ id, config })} />
        </div>
      </div>

      {credit ? <CreditScoreCard history={credit} /> : null}

      <div className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
        <div className="arbiter-card">
          <div className="arbiter-label">Balance chart</div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="chain" stroke="rgba(245,241,232,0.45)" />
                <YAxis stroke="rgba(245,241,232,0.45)" />
                <Tooltip />
                <Bar dataKey="usdt" fill="#35f1a2" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="arbiter-card">
          <div className="arbiter-label">Lifetime stats</div>
          <div className="mt-4 space-y-3 text-sm text-sand/70">
            <div>Total related loans: {loanHistory.length}</div>
            <div>Repaid loans: {loanHistory.filter((loan) => loan.status === 'repaid').length}</div>
            <div>Defaulted loans: {loanHistory.filter((loan) => loan.status === 'defaulted').length}</div>
            <div>Total balances tracked: {(balances.data ?? []).length}</div>
            <div>Preferred chains: {agent.config.preferredChains.join(', ')}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
