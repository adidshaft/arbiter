import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { RealtimeAlert, RealtimeEvent } from '../lib/types'

interface RealtimeContextValue {
  events: RealtimeEvent[]
  alerts: RealtimeAlert[]
  connectionStatus: 'connecting' | 'open' | 'closed' | 'error'
  reconnectCount: number
  pushEvent: (event: RealtimeEvent) => void
  pushAlert: (alert: RealtimeAlert) => void
  dismissAlert: (id: string) => void
  setConnectionState: (status: 'connecting' | 'open' | 'closed' | 'error', reconnectCount: number) => void
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null)

const MAX_EVENTS = 40
const MAX_ALERTS = 50

export function RealtimeProvider({ children }: { children: ReactNode }): JSX.Element {
  const [events, setEvents] = useState<RealtimeEvent[]>([])
  const [alerts, setAlerts] = useState<RealtimeAlert[]>([])
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'open' | 'closed' | 'error'>('connecting')
  const [reconnectCount, setReconnectCount] = useState(0)

  useEffect(() => {
    const stored = window.localStorage.getItem('arbiter:dismissed-alerts')
    if (stored === null) {
      return
    }
    try {
      const dismissed = JSON.parse(stored) as string[]
      if (Array.isArray(dismissed)) {
        setAlerts(previous =>
          previous.map(alert => (dismissed.includes(alert.id) ? { ...alert, dismissed: true } : alert))
        )
      }
    } catch {
      window.localStorage.removeItem('arbiter:dismissed-alerts')
    }
  }, [])

  const pushEvent = (event: RealtimeEvent): void => {
    setEvents(previous => [event, ...previous].slice(0, MAX_EVENTS))
  }

  const pushAlert = (alert: RealtimeAlert): void => {
    setAlerts(previous => {
      const index = previous.findIndex(item => item.id === alert.id)
      if (index === -1) {
        return [alert, ...previous].slice(0, MAX_ALERTS)
      }
      const next = [...previous]
      next[index] = alert
      return next
    })
  }

  const dismissAlert = (id: string): void => {
    setAlerts(previous => previous.map(alert => (alert.id === id ? { ...alert, dismissed: true } : alert)))
    const stored = window.localStorage.getItem('arbiter:dismissed-alerts')
    const dismissed = stored === null ? [] : (JSON.parse(stored) as string[])
    if (!dismissed.includes(id)) {
      window.localStorage.setItem('arbiter:dismissed-alerts', JSON.stringify([...dismissed, id]))
    }
  }

  const setConnectionState = (status: 'connecting' | 'open' | 'closed' | 'error', nextReconnectCount: number): void => {
    setConnectionStatus(status)
    setReconnectCount(nextReconnectCount)
  }

  return (
    <RealtimeContext.Provider
      value={{ events, alerts, connectionStatus, reconnectCount, pushEvent, pushAlert, dismissAlert, setConnectionState }}
    >
      {children}
    </RealtimeContext.Provider>
  )
}

export function useRealtimeFeed(): RealtimeContextValue {
  const context = useContext(RealtimeContext)
  if (context === null) {
    throw new Error('RealtimeProvider is missing')
  }
  return context
}
