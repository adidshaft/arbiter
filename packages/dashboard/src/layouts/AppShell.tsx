import { useMemo } from 'react'
import { Bell, LayoutDashboard, ShieldCheck, WalletCards, Wrench } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useRealtimeFeed } from '../app/realtime'
import { useAlerts } from '../hooks/useAlerts'
import { useAgents } from '../hooks/useAgents'
import AlertPanel from '../components/alerts/AlertPanel'
import { NETWORK_MODE } from '../lib/constants'

const navItems = [
  { to: '/', label: 'Fleet', icon: LayoutDashboard },
  { to: '/lending', label: 'Lending', icon: WalletCards },
  { to: '/trust', label: 'Trust', icon: ShieldCheck },
  { to: '/skills', label: 'Skills', icon: Wrench }
]

export default function AppShell(): JSX.Element {
  const { pauseAll } = useAgents()
  const { alerts, dismissAlert } = useAlerts()
  const { connectionStatus, reconnectCount, alerts: realtimeAlerts, dismissAlert: dismissRealtimeAlert } = useRealtimeFeed()

  const mergedAlerts = useMemo(() => {
    const merged = new Map<string, typeof realtimeAlerts[number]>()

    for (const alert of alerts.data ?? []) {
      merged.set(alert.id, { ...alert, source: 'api' })
    }

    for (const alert of realtimeAlerts) {
      merged.set(alert.id, alert)
    }

    return [...merged.values()].sort((left, right) => right.createdAt.localeCompare(left.createdAt))
  }, [alerts.data, realtimeAlerts])

  return (
    <div className="min-h-screen bg-premium-bg">
      <div className="fixed inset-0 bg-grid-pattern bg-[length:32px_32px] pointer-events-none opacity-20" />
      <div className="relative mx-auto flex min-h-screen max-w-[1800px]">
        <aside className="hidden w-80 flex-col border-r border-white/5 bg-black/40 px-8 py-10 backdrop-blur-3xl xl:flex">
          <div>
            <div className="arbiter-label">Arbiter System</div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-sand">Treasury terminal</h1>
            <p className="mt-4 text-[13px] leading-relaxed text-sand/50">
              Agentic treasury dashboard for autonomous capital management, real-time risk screening, and cross-chain settlement.
            </p>
          </div>
          <nav className="mt-12 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-4 rounded-2xl px-5 py-3.5 text-sm font-medium transition-all duration-300 ${
                    isActive ? 'bg-mint/10 text-mint shadow-glow-mint' : 'text-sand/40 hover:bg-white/5 hover:text-sand/80'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                    {item.label}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto pt-8">
            <div className="rounded-[2rem] border border-white/5 bg-white/[0.03] p-6">
              <div className="arbiter-label mb-4 opacity-50">Operational Control</div>
              <button
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-white/5 py-3 text-sm font-bold text-sand/80 transition-all hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 border border-transparent"
                type="button"
                onClick={() => pauseAll.mutate()}
              >
                Engage kill switch
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 px-6 py-8 md:px-10 xl:px-16 overflow-y-auto">
          <header className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between animate-fade-in">
            <div>
              <div className="arbiter-label mb-2 opacity-50">System Status</div>
              <div className="flex flex-wrap items-center gap-3">
                <span className={`flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${connectionStatus === 'open' ? 'border-mint/20 bg-mint/5 text-mint' : 'border-amber-500/20 bg-amber-500/5 text-amber-500'}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${connectionStatus === 'open' ? 'bg-mint animate-pulse' : 'bg-amber-500'}`} />
                  WS {connectionStatus}
                </span>
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${NETWORK_MODE === 'testnet' ? 'border-cyan-500/20 bg-cyan-500/5 text-cyan-400' : 'border-white/10 bg-white/5 text-sand/60'}`}>
                  {NETWORK_MODE}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/5 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-sand/40">
                  {reconnectCount} Reconnects
                </span>
              </div>
            </div>
            <div className="hidden lg:flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/[0.02] border border-white/5">
              <Bell size={14} className="text-mint animate-pulse" />
              <span className="text-[11px] font-medium text-sand/40 uppercase tracking-widest">Real-time Stream Active</span>
            </div>
          </header>
          
          <div className="grid gap-10 2xl:grid-cols-[minmax(0,1fr),380px]">
            <div className="min-w-0">
              <Outlet />
            </div>
            <aside className="space-y-8">
              <AlertPanel
                alerts={mergedAlerts}
                onDismiss={(id) => {
                  dismissRealtimeAlert(id)
                  dismissAlert.mutate(id)
                }}
              />
            </aside>
          </div>
        </main>
      </div>
    </div>
  )
}
