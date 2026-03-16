import { Link } from 'react-router-dom'
import type { SerializedAgent, SerializedAgentBalance } from '../../lib/types'
import { AGENT_STATUS_STYLES, CHAIN_ORDER, CHAIN_METADATA } from '../../lib/constants'
import { formatCurrency, formatDate } from '../../lib/formatters'

interface AgentCardProps {
  agent: SerializedAgent
  balances: SerializedAgentBalance[]
}

export default function AgentCard({ agent, balances }: AgentCardProps): JSX.Element {
  const status = AGENT_STATUS_STYLES[agent.status]
  const total = balances.reduce((sum, balance) => sum + Number(balance.usdtHuman), 0)

  return (
    <div className="arbiter-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="arbiter-label">{agent.role}</div>
          <h3 className="mt-2 text-xl font-semibold text-sand">{agent.name}</h3>
        </div>
        <span className={`arbiter-badge ${status.className}`}>{status.label}</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-sand/70">
        <div>
          <div className="arbiter-label">Credit</div>
          <div className="mt-1 arbiter-mono text-xl text-sand">{agent.creditScore}</div>
        </div>
        <div>
          <div className="arbiter-label">Fleet USDT</div>
          <div className="mt-1 arbiter-mono text-xl text-sand">{formatCurrency(total)}</div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {CHAIN_ORDER.filter((chainKey) => agent.wallets[chainKey]).map((chainKey) => (
          <span key={chainKey} className="arbiter-badge" style={{ borderColor: `${CHAIN_METADATA[chainKey].accent}33` }}>
            {CHAIN_METADATA[chainKey].name}
          </span>
        ))}
      </div>

      <div className="mt-4 text-xs uppercase tracking-[0.18em] text-sand/45">Created {formatDate(agent.createdAt)}</div>

      <div className="mt-5">
        <Link className="arbiter-button" to={`/config/${agent.id}`}>
          Open config
        </Link>
      </div>
    </div>
  )
}

