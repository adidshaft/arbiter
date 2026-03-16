import clsx from 'clsx'

interface StatCardProps {
  label: string
  value: string
  helper?: string
  tone?: 'default' | 'mint' | 'amber' | 'red'
}

export default function StatCard({ label, value, helper, tone = 'default' }: StatCardProps): JSX.Element {
  return (
    <div
      className={clsx(
        'arbiter-card animate-fade-in',
        tone === 'mint' && 'border-mint/20',
        tone === 'amber' && 'border-amber-400/20',
        tone === 'red' && 'border-red-400/20'
      )}
    >
      <div className="arbiter-label">{label}</div>
      <div className="mt-3 arbiter-mono text-3xl font-bold text-sand">{value}</div>
      {helper ? <p className="mt-2 text-sm text-sand/60">{helper}</p> : null}
    </div>
  )
}

