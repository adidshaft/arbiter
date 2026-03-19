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
    <div className="min-h-screen bg-radial bg-grid bg-[length:32px_32px]">
      <div className="mx-auto flex min-h-screen max-w-[1800px]">
        <aside className="hidden w-72 flex-col border-r border-white/8 bg-black/20 px-6 py-8 backdrop-blur-xl xl:flex">
          <div>
            <div className="arbiter-label">Arbiter</div>
            <h1 className="mt-3 text-3xl font-semibold text-sand">Treasury terminal</h1>
            <p className="mt-3 text-sm text-sand/60">
              AI agents with AI security screening, AI-native lending, and automated treasury settlement across live networks.
            </p>
          </div>
          <nav className="mt-10 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
                    isActive ? 'bg-mint/10 text-mint shadow-glow' : 'text-sand/65 hover:bg-white/5 hover:text-sand'
                  }`
                }
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="arbiter-label">Fleet control</div>
            <button className="arbiter-button mt-4 w-full justify-center" type="button" onClick={() => pauseAll.mutate()}>
              Engage kill switch
            </button>
          </div>
        </aside>

        <main className="flex-1 px-4 py-6 md:px-6 xl:px-10">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="arbiter-label">Runtime</div>
              <div className="mt-2 flex items-center gap-3 text-sm text-sand/70">
                <span className={`arbiter-badge ${connectionStatus === 'open' ? 'border-mint/30 bg-mint/10 text-mint' : 'border-amber-400/30 bg-amber-400/10 text-amber-100'}`}>
                  Websocket {connectionStatus}
                </span>
                <span className={`arbiter-badge ${NETWORK_MODE === 'testnet' ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-100' : 'border-white/15 bg-white/5 text-sand/75'}`}>
                  {NETWORK_MODE}
                </span>
                <span className="arbiter-badge">Reconnects {reconnectCount}</span>
              </div>
            </div>
            <div className="hidden items-center gap-2 lg:flex">
              <Bell size={16} className="text-mint" />
              <span className="text-sm text-sand/60">Live updates stream into the event and alert panels automatically.</span>
            </div>
          </div>
          <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr),360px]">
            <div className="min-w-0">
              <Outlet />
            </div>
            <div className="space-y-6">
              <AlertPanel
                alerts={mergedAlerts}
                onDismiss={(id) => {
                  dismissRealtimeAlert(id)
                  dismissAlert.mutate(id)
                }}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
