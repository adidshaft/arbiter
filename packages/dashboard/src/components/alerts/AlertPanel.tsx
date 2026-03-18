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
    <div className="arbiter-card">
      <div className="flex items-center justify-between">
        <div>
          <div className="arbiter-label">Alert Panel</div>
          <h3 className="mt-2 text-lg font-semibold text-sand">Open alerts</h3>
        </div>
        <span className="arbiter-badge">{visibleAlerts.length} active</span>
      </div>

      <div className="mt-4 space-y-3">
        {visibleAlerts.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-sand/60">
            No active alerts. Fleet conditions look stable.
          </div>
        ) : (
          visibleAlerts.map((alert) => (
            <div
              key={alert.id}
              className={clsx(
                'rounded-xl border p-4',
                alert.severity === 'critical'
                  ? 'border-red-400/25 bg-red-400/8'
                  : alert.severity === 'warning'
                    ? 'border-amber-400/25 bg-amber-400/8'
                    : 'border-mint/20 bg-mint/5'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  {alert.severity === 'critical' ? (
                    <ShieldAlert className="mt-1 text-red-200" size={18} />
                  ) : alert.severity === 'warning' ? (
                    <AlertTriangle className="mt-1 text-amber-100" size={18} />
                  ) : (
                    <BellRing className="mt-1 text-mint" size={18} />
                  )}
                  <div>
                    <div className="arbiter-mono text-sm text-sand">{alert.message}</div>
                    <div className="mt-1 text-xs text-sand/60">{humanizeAlert(alert as never)}</div>
                    <div className="mt-2 text-[11px] uppercase tracking-[0.18em] text-sand/45">
                      {formatDate(alert.createdAt)}
                    </div>
                  </div>
                </div>
                <button type="button" className="arbiter-button-secondary text-xs" onClick={() => onDismiss(alert.id)}>
                  Dismiss
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
