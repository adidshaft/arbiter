import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useWebSocket } from '../hooks/useWebSocket'
import { useRealtimeFeed } from './realtime'
import type { RealtimeAlert, RealtimeEvent, WebSocketEnvelope } from '../lib/types'

function toRealtimeEvent(envelope: WebSocketEnvelope): RealtimeEvent {
  const eventId = typeof envelope.payload.eventId === 'string'
    ? envelope.payload.eventId
    : `${envelope.type}:${envelope.timestamp}:${Math.random().toString(16).slice(2)}`
  const timestamp = typeof envelope.payload.eventTimestamp === 'string' ? envelope.payload.eventTimestamp : envelope.timestamp
  return {
    id: eventId,
    ...envelope,
    timestamp
  }
}

function isAlertPayload(payload: Record<string, unknown>): payload is Record<string, unknown> & RealtimeAlert {
  return (
    typeof payload.id === 'string' &&
    typeof payload.type === 'string' &&
    typeof payload.severity === 'string' &&
    typeof payload.agentId === 'string' &&
    typeof payload.message === 'string' &&
    typeof payload.dismissed === 'boolean' &&
    typeof payload.createdAt === 'string'
  )
}

function invalidationsFor(type: WebSocketEnvelope['type'], payload: Record<string, unknown>): string[][] {
  const baseInvalidations: string[][] = [['events']]
  switch (type) {
    case 'loan_requested':
    case 'loan_approved':
    case 'loan_rejected':
    case 'loan_disbursed':
    case 'loan_repaid':
      baseInvalidations.push(['loans'], ['pool'], ['agents'], ['balances'], ['credit'])
      break
    case 'trust_scored':
      baseInvalidations.push(['trust'])
      break
    case 'skill_executed':
      baseInvalidations.push(['skills'], ['skillExecutions'], ['balances'])
      break
    case 'alert_created':
      baseInvalidations.push(['alerts'])
      break
    case 'agent_paused':
    case 'kill_switch':
      baseInvalidations.push(['agents'], ['balances'], ['credit'])
      break
    case 'bridge_initiated':
      baseInvalidations.push(['loans'], ['agents'], ['balances'])
      break
    default:
      break
  }

  if (typeof payload.agentId === 'string') {
    baseInvalidations.push(['agent', payload.agentId], ['balances', payload.agentId], ['credit', payload.agentId])
  }

  return baseInvalidations
}

export function WebSocketBridge(): JSX.Element | null {
  const queryClient = useQueryClient()
  const { lastMessage, status, reconnectCount } = useWebSocket()
  const { pushAlert, pushEvent, setConnectionState } = useRealtimeFeed()

  useEffect(() => {
    setConnectionState(status, reconnectCount)
  }, [reconnectCount, setConnectionState, status])

  useEffect(() => {
    if (lastMessage === null) {
      return
    }

    const event = toRealtimeEvent(lastMessage)
    pushEvent(event)

    for (const key of invalidationsFor(event.type, event.payload)) {
      void queryClient.invalidateQueries({ queryKey: key })
    }

    if (event.type === 'alert_created' && isAlertPayload(event.payload)) {
      pushAlert({ ...event.payload, source: 'websocket' })
      if (event.payload.severity !== 'info') {
        toast.error(event.payload.message)
      }
      return
    }

    if (event.type === 'kill_switch') {
      toast('Kill switch engaged')
      return
    }

    if (status === 'open' && event.type === 'loan_disbursed') {
      toast.success('Loan disbursed')
      return
    }

    if (status === 'open' && event.type === 'loan_repaid') {
      toast.success('Loan repaid')
    }
  }, [lastMessage, pushAlert, pushEvent, queryClient, status])

  return null
}
