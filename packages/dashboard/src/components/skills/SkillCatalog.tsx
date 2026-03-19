import type { ChainKey } from '@arbiter/core'
import type { SerializedAgentSkill } from '../../lib/types'
import { formatSkillChains } from '../../lib/formatters'

interface SkillCatalogProps {
  skills: SerializedAgentSkill[]
  selectedAgentId?: string
  selectedChainKey: ChainKey
  pendingSkillId?: string
  onExecute: (payload: { skillId: string; agentId: string; chainKey: SerializedAgentSkill['supportedChains'][number] }) => void
}

export default function SkillCatalog({
  skills,
  selectedAgentId,
  selectedChainKey,
  pendingSkillId,
  onExecute
}: SkillCatalogProps): JSX.Element {
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
            disabled={!selectedAgentId || !skill.supportedChains.includes(selectedChainKey) || pendingSkillId !== undefined}
            onClick={() => {
              if (!selectedAgentId || !skill.supportedChains.includes(selectedChainKey)) {
                return
              }
              onExecute({ skillId: skill.skillId, agentId: selectedAgentId, chainKey: selectedChainKey })
            }}
          >
            {pendingSkillId === skill.skillId ? 'Executing...' : 'Execute'}
          </button>
        </div>
      ))}
    </div>
  )
}
