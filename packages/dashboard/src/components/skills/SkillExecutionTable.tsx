import type { SerializedSkillExecution } from '../../lib/types'
import { formatDate } from '../../lib/formatters'

interface SkillExecutionTableProps {
  executions: SerializedSkillExecution[]
}

export default function SkillExecutionTable({ executions }: SkillExecutionTableProps): JSX.Element {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <table className="min-w-full divide-y divide-white/10 text-sm">
        <thead className="bg-white/5 text-left text-xs uppercase tracking-[0.18em] text-sand/55">
          <tr>
            <th className="px-4 py-3">Execution</th>
            <th className="px-4 py-3">Agent</th>
            <th className="px-4 py-3">Chain</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Started</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {executions.map((execution) => (
            <tr key={execution.executionId}>
              <td className="px-4 py-3 text-sand">{execution.skillId}</td>
              <td className="px-4 py-3 text-sand/70">{execution.agentId}</td>
              <td className="px-4 py-3 text-sand/70">{execution.chainKey}</td>
              <td className="px-4 py-3 text-sand/70">{execution.status}</td>
              <td className="px-4 py-3 text-sand/60">{formatDate(execution.startedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

