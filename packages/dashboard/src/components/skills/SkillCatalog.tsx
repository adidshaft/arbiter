import type { SerializedAgent, SerializedAgentSkill } from '../../lib/types'
import { formatSkillChains } from '../../lib/formatters'

interface SkillCatalogProps {
  skills: SerializedAgentSkill[]
  agents: SerializedAgent[]
  onExecute: (payload: { skillId: string; agentId: string; chainKey: SerializedAgentSkill['supportedChains'][number] }) => void
}

export default function SkillCatalog({ skills, agents, onExecute }: SkillCatalogProps): JSX.Element {
  const defaultAgentId = agents[0]?.id

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {skills.map((skill) => (
        <div key={skill.skillId} className="arbiter-card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="arbiter-label">Skill</div>
              <h3 className="mt-2 text-lg font-semibold text-sand">{skill.name}</h3>
            </div>
            <span className="arbiter-badge">{skill.estimatedDurationSecs}s</span>
          </div>
          <p className="mt-3 text-sm text-sand/70">{skill.description}</p>
          <div className="mt-3 text-xs uppercase tracking-[0.18em] text-sand/45">{formatSkillChains(skill)}</div>
          <button
            type="button"
            className="arbiter-button mt-5"
            disabled={!defaultAgentId || skill.supportedChains.length === 0}
            onClick={() => {
              const defaultChain = skill.supportedChains[0]
              if (!defaultAgentId || !defaultChain) {
                return
              }
              onExecute({ skillId: skill.skillId, agentId: defaultAgentId, chainKey: defaultChain })
            }}
          >
            Execute
          </button>
        </div>
      ))}
    </div>
  )
}
