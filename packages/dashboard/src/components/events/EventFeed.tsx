import type { SerializedOrchestratorEvent } from '../../lib/types'
import { humanizeEvent } from '../../lib/humanize'
import { formatDate } from '../../lib/formatters'

interface EventFeedProps {
  events: SerializedOrchestratorEvent[]
}

export default function EventFeed({ events }: EventFeedProps): JSX.Element {
  return (
    <div className="arbiter-card border-white/5 bg-black/20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="arbiter-label opacity-40">System Orchestration</div>
          <h3 className="mt-1 text-xl font-bold text-sand">Live Activity Feed</h3>
        </div>
        <div className="px-3 py-1 rounded-full border border-mint/20 bg-mint/5 text-[10px] font-bold text-mint uppercase tracking-widest animate-pulse">
          Monitoring
        </div>
      </div>
      
      <div className="space-y-1">
        {events.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 text-center">
            <p className="text-xs font-medium text-sand/30 uppercase tracking-widest leading-loose">
              Initializing secure<br />event stream...
            </p>
          </div>
        ) : (
          events.map((event) => (
            <div key={event.id} className="group flex items-start gap-4 p-4 rounded-xl transition-colors hover:bg-white/[0.02]">
              <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mint/40 group-hover:bg-mint group-hover:shadow-[0_0_8px_rgba(53,241,162,0.6)] transition-all" />
              <div className="flex-1 min-w-0">
                <div className="arbiter-mono text-sm text-sand/90 tracking-tight leading-relaxed break-words">
                  {humanizeEvent(event as never)}
                </div>
                <div className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-sand/20 group-hover:text-sand/40 transition-colors">
                  {formatDate(event.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

