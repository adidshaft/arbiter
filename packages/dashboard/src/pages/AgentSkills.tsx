import { useAgents } from '../hooks/useAgents'
import { useSkills } from '../hooks/useSkills'
import SkillCatalog from '../components/skills/SkillCatalog'
import SkillExecutionTable from '../components/skills/SkillExecutionTable'

export default function AgentSkills(): JSX.Element {
  const agents = useAgents()
  const skills = useSkills()

  return (
    <div className="space-y-6">
      <div className="arbiter-card">
        <div className="arbiter-label">Skill catalog</div>
        <h2 className="mt-2 text-xl font-semibold text-sand">Run treasury skills against the demo fleet</h2>
      </div>

      <SkillCatalog
        skills={skills.skills.data ?? []}
        agents={agents.data ?? []}
        onExecute={(payload) => skills.executeSkill.mutate({ ...payload, input: { targetChainKey: 'ARBITRUM', amount: 1 } })}
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

