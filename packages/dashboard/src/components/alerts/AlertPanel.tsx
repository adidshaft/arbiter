import clsx from 'clsx'
import { useEffect } from 'react'
import { AlertTriangle, BellRing, ShieldAlert } from 'lucide-react'
import { humanizeAlert } from '../../lib/humanize'
import type { SerializedAlert } from '../../lib/types'
import { formatDate } from '../../lib/formatters'

interface AlertPanelProps {
  alerts: SerializedAlert[]
  onDismiss: (id: string) => void
}

export default function AlertPanel({ alerts, onDismiss }: AlertPanelProps): JSX.Element {
  const visibleAlerts = alerts.filter((alert) => !alert.dismissed)

  useEffect(() => {
    const timers = visibleAlerts
      .filter((alert) => alert.severity === 'info')
      .map((alert) => window.setTimeout(() => onDismiss(alert.id), 30_000))

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [onDismiss, visibleAlerts])

  return (
    <div className="arbiter-card border-white/5">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="arbiter-label opacity-40">Security Monitor</div>
          <h3 className="mt-1 text-xl font-bold text-sand">Active Alerts</h3>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-mint/10 text-[11px] font-bold text-mint ring-1 ring-mint/20">
          {visibleAlerts.length}
        </div>
      </div>

      <div className="space-y-4">
        {visibleAlerts.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 text-center">
            <ShieldAlert className="mx-auto mb-3 text-white/10" size={32} />
            <p className="text-xs font-medium text-sand/30 uppercase tracking-widest leading-loose">
              System conditions<br />fully optimized
            </p>
          </div>
        ) : (
          visibleAlerts.map((alert) => (
            <div
              key={alert.id}
              className={clsx(
                'group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:scale-[1.02]',
                alert.severity === 'critical'
                  ? 'border-red-500/20 bg-red-500/5'
                  : alert.severity === 'warning'
                    ? 'border-amber-500/20 bg-amber-500/5'
                    : 'border-mint/20 bg-mint/5'
              )}
            >
              <div className="relative z-10 flex gap-4">
                <div className={clsx(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border',
                  alert.severity === 'critical' ? 'border-red-500/20 text-red-400' : 
                  alert.severity === 'warning' ? 'border-amber-500/20 text-amber-400' : 
                  'border-mint/20 text-mint'
                )}>
                  {alert.severity === 'critical' ? (
                    <ShieldAlert size={20} />
                  ) : alert.severity === 'warning' ? (
                    <AlertTriangle size={20} />
                  ) : (
                    <BellRing size={20} />
                  )}
                </div>
                
                <div className="min-w-0 flex-1">
                  <div className="arbiter-mono text-[13px] font-bold text-sand break-words leading-relaxed">
                    {alert.message}
                  </div>
                  <div className="mt-2 text-xs font-semibold text-sand/40 italic">
                    {humanizeAlert(alert as never)}
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-sand/20">
                      {formatDate(alert.createdAt)}
                    </span>
                    <button 
                      type="button" 
                      className="text-[10px] font-bold uppercase tracking-widest text-mint/60 hover:text-mint transition-colors cursor-pointer" 
                      onClick={() => onDismiss(alert.id)}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
