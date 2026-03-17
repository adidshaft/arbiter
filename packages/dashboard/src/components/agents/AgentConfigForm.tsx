import { useState } from 'react'
import type { SerializedAgent } from '../../lib/types'

interface AgentConfigFormProps {
  agent: SerializedAgent
  onSubmit: (config: SerializedAgent['config']) => void
}

export default function AgentConfigForm({ agent, onSubmit }: AgentConfigFormProps): JSX.Element {
  const [form, setForm] = useState(agent.config)

  return (
    <form
      className="grid gap-4 md:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit(form)
      }}
    >
      <label className="space-y-2">
        <span className="arbiter-label">Max transaction size</span>
        <input
          className="arbiter-field"
          type="number"
          value={form.maxTransactionSize}
          onChange={(event) => setForm((current) => ({ ...current, maxTransactionSize: Number(event.target.value) }))}
        />
      </label>
      <label className="space-y-2">
        <span className="arbiter-label">Daily cap</span>
        <input
          className="arbiter-field"
          type="number"
          value={form.dailySpendingCap}
          onChange={(event) => setForm((current) => ({ ...current, dailySpendingCap: Number(event.target.value) }))}
        />
      </label>
      <label className="space-y-2">
        <span className="arbiter-label">Min balance floor</span>
        <input
          className="arbiter-field"
          type="number"
          value={form.minBalanceFloor}
          onChange={(event) => setForm((current) => ({ ...current, minBalanceFloor: Number(event.target.value) }))}
        />
      </label>
      <label className="space-y-2">
        <span className="arbiter-label">Lending opt-in</span>
        <select
          className="arbiter-field"
          value={form.lendingOptIn ? 'yes' : 'no'}
          onChange={(event) => setForm((current) => ({ ...current, lendingOptIn: event.target.value === 'yes' }))}
        >
          <option value="yes">Enabled</option>
          <option value="no">Disabled</option>
        </select>
      </label>
      <div className="md:col-span-2">
        <button className="arbiter-button" type="submit">
          Save configuration
        </button>
      </div>
    </form>
  )
}

