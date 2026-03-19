import { useState } from 'react'
import type { ChainKey } from '@arbiter/core'
import { CHAIN_ORDER } from '../../lib/constants'

interface ContractScoreFormProps {
  onSubmit: (payload: { contractAddress: string; chainKey: ChainKey }) => void
  isPending?: boolean
}

export default function ContractScoreForm({ onSubmit, isPending = false }: ContractScoreFormProps): JSX.Element {
  const [contractAddress, setContractAddress] = useState('0xfeed000000000000000000000000000000000005')
  const [chainKey, setChainKey] = useState<ChainKey>('POLYGON')

  return (
    <form
      className="grid gap-4 md:grid-cols-[2fr,1fr,auto]"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit({ contractAddress, chainKey })
      }}
    >
      <input className="arbiter-field" value={contractAddress} onChange={(event) => setContractAddress(event.target.value)} />
      <select className="arbiter-field" value={chainKey} onChange={(event) => setChainKey(event.target.value as ChainKey)}>
        {CHAIN_ORDER.map((candidate) => (
          <option key={candidate} value={candidate}>
            {candidate}
          </option>
        ))}
      </select>
      <button className="arbiter-button" type="submit" disabled={isPending}>
        {isPending ? 'Scoring...' : 'Score contract'}
      </button>
    </form>
  )
}
