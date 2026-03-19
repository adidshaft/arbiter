import clsx from 'clsx'
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
    <div className="arbiter-card group">
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="arbiter-label opacity-50 mb-1">{agent.role}</div>
          <h3 className="text-2xl font-bold tracking-tight text-sand group-hover:text-mint transition-colors underline decoration-mint/0 group-hover:decoration-mint/30 decoration-2 underline-offset-4">
            {agent.name}
          </h3>
        </div>
        <div className={clsx(
          'px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border shadow-sm',
          agent.status !== 'paused' ? 'border-mint/20 bg-mint/10 text-mint' : 
          'border-amber-500/20 bg-amber-500/10 text-amber-500'
        )}>
          {agent.status}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <div className="arbiter-label opacity-40 mb-2">Trust Score</div>
          <div className="arbiter-mono text-3xl font-bold text-sand leading-none">{agent.creditScore}</div>
          <div className="mt-2 h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-mint shadow-[0_0_8px_rgba(53,241,162,0.4)]" style={{ width: `${Math.min(100, (agent.creditScore / 2000) * 100)}%` }} />
          </div>
        </div>
        <div>
          <div className="arbiter-label opacity-40 mb-2">Total Value</div>
          <div className="arbiter-mono text-3xl font-bold text-sand leading-none flex items-baseline gap-1">
            <span className="text-mint/40 text-sm italic">$</span>
            {total.toFixed(0)}
            <span className="text-sand/30 text-xs font-normal">.{total.toFixed(2).split('.')[1]}</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <div className="arbiter-label opacity-40 mb-3">Active Networks</div>
          <div className="flex flex-wrap gap-2">
            {CHAIN_ORDER.filter((chainKey) => agent.wallets[chainKey]).map((chainKey) => (
              <span 
                key={chainKey} 
                className="inline-flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.03] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-sand/60 hover:border-white/10 hover:bg-white/[0.05] transition-all"
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: CHAIN_METADATA[chainKey].accent }} />
                {CHAIN_METADATA[chainKey].name.split(' ')[0]}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-white/5">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-sand/20">
            Deployed {formatDate(agent.createdAt).split(',')[0]}
          </div>
          <Link 
            className="text-[11px] font-bold uppercase tracking-widest text-mint/60 hover:text-mint hover:translate-x-1 transition-all flex items-center gap-2" 
            to={`/config/${agent.id}`}
          >
            Configure System →
          </Link>
        </div>
      </div>
    </div>
  )
}

