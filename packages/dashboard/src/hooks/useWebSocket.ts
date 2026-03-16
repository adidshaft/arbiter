import { useEffect, useRef, useState } from 'react'
import type { WebSocketEnvelope } from '../lib/types'
import { getApiErrorMessage } from '../lib/api'

export type WebSocketStatus = 'connecting' | 'open' | 'closed' | 'error'

export interface UseWebSocketResult {
  status: WebSocketStatus
  lastMessage: WebSocketEnvelope | null
  reconnectCount: number
}

const WEBSOCKET_URL = import.meta.env.VITE_WS_URL?.toString() || 'ws://localhost:3001'

export function useWebSocket(): UseWebSocketResult {
  const [status, setStatus] = useState<WebSocketStatus>('connecting')
  const [lastMessage, setLastMessage] = useState<WebSocketEnvelope | null>(null)
  const [reconnectCount, setReconnectCount] = useState(0)
  const socketRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<number | null>(null)
  const heartbeatTimerRef = useRef<number | null>(null)
  const attemptRef = useRef(0)

  useEffect(() => {
    let disposed = false

    const clearTimers = (): void => {
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
      if (heartbeatTimerRef.current !== null) {
        window.clearInterval(heartbeatTimerRef.current)
        heartbeatTimerRef.current = null
      }
    }

    const connect = (): void => {
      if (disposed) {
        return
      }

      setStatus('connecting')
      const socket = new WebSocket(WEBSOCKET_URL)
      socketRef.current = socket

      socket.onopen = () => {
        if (disposed) {
          socket.close()
          return
        }
        attemptRef.current = 0
        setReconnectCount(0)
        setStatus('open')
        heartbeatTimerRef.current = window.setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() }))
          }
        }, 30000)
      }

      socket.onmessage = event => {
        try {
          const parsed = JSON.parse(event.data as string) as WebSocketEnvelope
          setLastMessage(parsed)
        } catch (error: unknown) {
          setStatus('error')
          console.warn('Failed to parse websocket message', getApiErrorMessage(error))
        }
      }

      socket.onerror = () => {
        setStatus('error')
      }

      socket.onclose = () => {
        if (disposed) {
          return
        }
        clearTimers()
        setStatus('closed')
        attemptRef.current += 1
        const waitMs = Math.min(1000 * 2 ** attemptRef.current, 15000)
        setReconnectCount(attemptRef.current)
        reconnectTimerRef.current = window.setTimeout(connect, waitMs)
      }
    }

    connect()

    return () => {
      disposed = true
      clearTimers()
      socketRef.current?.close()
    }
  }, [])

  return {
    status,
    lastMessage,
    reconnectCount
  }
}
