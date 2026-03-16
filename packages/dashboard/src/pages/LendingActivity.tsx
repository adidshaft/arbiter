import { useMemo, useState } from 'react'
import PoolStats from '../components/lending/PoolStats'
import LoanTable from '../components/lending/LoanTable'
import CreditScoreCard from '../components/lending/CreditScoreCard'
import { useAgents } from '../hooks/useAgents'
import { useLending } from '../hooks/useLending'
import { CHAIN_ORDER } from '../lib/constants'

export default function LendingActivity(): JSX.Element {
  const agents = useAgents()
  const [borrowerAgentId, setBorrowerAgentId] = useState('agent_beta')
  const [amount, setAmount] = useState(35)
  const [chainKey, setChainKey] = useState<(typeof CHAIN_ORDER)[number]>('POLYGON')
  const lending = useLending((agents.data ?? []).map((agent) => agent.id))

  const borrowerCredits = useMemo(
    () => lending.credits.find((credit) => credit.data?.agentId === borrowerAgentId)?.data,
    [borrowerAgentId, lending.credits]
  )

  return (
    <div className="space-y-6">
      {lending.pool.data ? <PoolStats pool={lending.pool.data} /> : null}

      <div className="arbiter-card">
        <div className="arbiter-label">Request loan</div>
        <form
          className="mt-4 grid gap-4 lg:grid-cols-[1.2fr,120px,180px,2fr,auto]"
          onSubmit={(event) => {
            event.preventDefault()
            lending.requestLoan.mutate({
              borrowerAgentId,
              amount,
              chainKey,
              targetContract: '0xfeed000000000000000000000000000000000001',
              taskDescription: 'Dashboard initiated lending request'
            })
          }}
        >
          <select className="arbiter-field" value={borrowerAgentId} onChange={(event) => setBorrowerAgentId(event.target.value)}>
            {(agents.data ?? []).map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
          <input className="arbiter-field" type="number" value={amount} onChange={(event) => setAmount(Number(event.target.value))} />
          <select className="arbiter-field" value={chainKey} onChange={(event) => setChainKey(event.target.value as typeof chainKey)}>
            {CHAIN_ORDER.map((chain) => (
              <option key={chain} value={chain}>
                {chain}
              </option>
            ))}
          </select>
          <input className="arbiter-field" value="0xfeed000000000000000000000000000000000001" readOnly />
          <button className="arbiter-button" type="submit">
            Submit request
          </button>
        </form>
      </div>

      {borrowerCredits ? <CreditScoreCard history={borrowerCredits} /> : null}

      <div className="arbiter-card">
        <div className="arbiter-label">Loan book</div>
        <h3 className="mt-2 text-lg font-semibold text-sand">Active and historical loans</h3>
        <div className="mt-4">
          <LoanTable loans={lending.loans.data ?? []} onRepay={(loanId) => lending.repay.mutate(loanId)} />
        </div>
      </div>
    </div>
  )
}

