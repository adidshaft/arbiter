import { useEffect, useMemo, useState } from 'react'
import PoolStats from '../components/lending/PoolStats'
import LoanTable from '../components/lending/LoanTable'
import CreditScoreCard from '../components/lending/CreditScoreCard'
import { useAgents } from '../hooks/useAgents'
import { useLending } from '../hooks/useLending'
import { CHAIN_ORDER } from '../lib/constants'

export default function LendingActivity(): JSX.Element {
  const agents = useAgents()
  const [borrowerAgentId, setBorrowerAgentId] = useState('')
  const [amount, setAmount] = useState(35)
  const [chainKey, setChainKey] = useState<(typeof CHAIN_ORDER)[number]>('POLYGON')
  const [targetContract, setTargetContract] = useState('0x31a44d5dcA53A0BFB13C79d8dF5ED3148f08DB97')
  const [taskDescription, setTaskDescription] = useState('Live treasury lending request')
  const lending = useLending((agents.data ?? []).map((agent) => agent.id))
  const borrowerOptions = useMemo(() => {
    const allAgents = agents.data ?? []
    const borrowers = allAgents.filter((agent) => agent.role === 'borrower')
    return borrowers.length > 0 ? borrowers : allAgents
  }, [agents.data])

  useEffect(() => {
    if (!borrowerAgentId && borrowerOptions[0]) {
      setBorrowerAgentId(borrowerOptions[0].id)
    }
  }, [borrowerAgentId, borrowerOptions])

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
          className="mt-4 grid gap-4 lg:grid-cols-[1.2fr,120px,180px,1.8fr,1.4fr,auto]"
          onSubmit={(event) => {
            event.preventDefault()
            if (!borrowerAgentId) {
              return
            }
            lending.requestLoan.mutate({
              borrowerAgentId,
              amount,
              chainKey,
              targetContract,
              taskDescription
            })
          }}
        >
          <select className="arbiter-field" value={borrowerAgentId} onChange={(event) => setBorrowerAgentId(event.target.value)}>
            {borrowerOptions.map((agent) => (
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
          <input className="arbiter-field" value={targetContract} onChange={(event) => setTargetContract(event.target.value)} />
          <input className="arbiter-field" value={taskDescription} onChange={(event) => setTaskDescription(event.target.value)} />
          <button className="arbiter-button" type="submit" disabled={!borrowerAgentId || lending.requestLoan.isPending}>
            {lending.requestLoan.isPending ? 'Submitting...' : 'Submit request'}
          </button>
        </form>
        <p className="mt-3 text-sm text-sand/55">
          Use a borrower with an active wallet and keep the lender opted into lending on the config page for live same-chain requests.
        </p>
      </div>

      {borrowerCredits ? <CreditScoreCard history={borrowerCredits} /> : null}

      <div className="arbiter-card">
        <div className="arbiter-label">Loan book</div>
        <h3 className="mt-2 text-lg font-semibold text-sand">Active and historical loans</h3>
        <div className="mt-4">
          <LoanTable
            loans={lending.loans.data ?? []}
            isRepaying={lending.repay.isPending}
            repayingLoanId={lending.repay.variables}
            onRepay={(loanId) => lending.repay.mutate(loanId)}
          />
        </div>
      </div>
    </div>
  )
}
