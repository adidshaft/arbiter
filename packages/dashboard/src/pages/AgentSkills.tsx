import { useEffect, useMemo, useState } from 'react'
import { useAgents } from '../hooks/useAgents'
import { useSkills } from '../hooks/useSkills'
import SkillCatalog from '../components/skills/SkillCatalog'
import SkillExecutionTable from '../components/skills/SkillExecutionTable'
import { CHAIN_ORDER } from '../lib/constants'

export default function AgentSkills(): JSX.Element {
  const agents = useAgents()
  const skills = useSkills()
  const executableAgents = agents.data ?? []
  const [selectedAgentId, setSelectedAgentId] = useState('')
  const [selectedChainKey, setSelectedChainKey] = useState<(typeof CHAIN_ORDER)[number]>('POLYGON')

  useEffect(() => {
    if (!selectedAgentId && executableAgents[0]) {
      setSelectedAgentId(executableAgents[0].id)
    }
  }, [selectedAgentId, executableAgents])

  const selectedAgent = useMemo(
    () => executableAgents.find((agent) => agent.id === selectedAgentId),
    [executableAgents, selectedAgentId]
  )

  return (
    <div className="space-y-6">
      <div className="arbiter-card">
        <div className="arbiter-label">Skill catalog</div>
        <h2 className="mt-2 text-xl font-semibold text-sand">Run treasury skills against a live agent</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <select className="arbiter-field" value={selectedAgentId} onChange={(event) => setSelectedAgentId(event.target.value)}>
            {executableAgents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
          <select className="arbiter-field" value={selectedChainKey} onChange={(event) => setSelectedChainKey(event.target.value as typeof selectedChainKey)}>
            {CHAIN_ORDER.map((chain) => (
              <option key={chain} value={chain}>
                {chain}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-3 text-sm text-sand/55">
          {selectedAgent ? `Executing as ${selectedAgent.name}.` : 'Create or load an agent to run skills.'}
        </p>
      </div>

      <SkillCatalog
        skills={skills.skills.data ?? []}
        selectedAgentId={selectedAgentId}
        selectedChainKey={selectedChainKey}
        pendingSkillId={skills.executeSkill.isPending ? skills.executeSkill.variables?.skillId : undefined}
        onExecute={(payload) => skills.executeSkill.mutate({ ...payload, input: { targetChainKey: selectedChainKey, amount: 1 } })}
      />

      <div className="arbiter-card">
        <div className="arbiter-label">Execution history</div>
        <div className="mt-4">
          <SkillExecutionTable executions={skills.executions.data ?? []} />
        </div>
      </div>
    </div>
  )
}
