import type { SerializedOrchestratorEvent } from '../../lib/types'
import { humanizeEvent } from '../../lib/humanize'
import { formatDate } from '../../lib/formatters'

interface EventFeedProps {
  events: SerializedOrchestratorEvent[]
}

export default function EventFeed({ events }: EventFeedProps): JSX.Element {
  return (
    <div className="arbiter-card">
      <div className="arbiter-label">Event Feed</div>
      <h3 className="mt-2 text-lg font-semibold text-sand">Recent orchestration activity</h3>
      <div className="mt-4 space-y-3">
        {events.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-sand/60">
            Waiting for new events from the API.
          </div>
        ) : (
          events.map((event) => (
            <div key={event.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="arbiter-mono text-sm text-sand">{humanizeEvent(event as never)}</div>
              <div className="mt-2 text-xs uppercase tracking-[0.18em] text-sand/45">{formatDate(event.timestamp)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

