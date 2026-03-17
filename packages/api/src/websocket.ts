import type { Server as HttpServer } from 'node:http'
import { WebSocketServer, type WebSocket } from 'ws'
import { serializeApiResponse } from './utils/serialize.js'

export interface WebSocketHub {
  attach(server: HttpServer): void
  broadcast(type: string, payload: Record<string, unknown>): void
  close(): Promise<void>
}

export function createWebSocketHub(): WebSocketHub {
  let server: WebSocketServer | null = null
  const clients = new Set<WebSocket>()
  let pingTimer: NodeJS.Timeout | null = null

  return {
    attach(httpServer) {
      if (server) {
        return
      }

      server = new WebSocketServer({ server: httpServer })
      server.on('connection', (socket) => {
        clients.add(socket)
        socket.on('close', () => {
          clients.delete(socket)
        })
        socket.on('error', () => {
          clients.delete(socket)
        })
      })

      pingTimer = setInterval(() => {
        for (const client of clients) {
          if (client.readyState === client.OPEN) {
            client.ping()
          } else {
            clients.delete(client)
          }
        }
      }, 30_000)
    },
    broadcast(type, payload) {
      const message = JSON.stringify(
        serializeApiResponse({
          type,
          payload,
          timestamp: new Date()
        })
      )

      for (const client of clients) {
        if (client.readyState === client.OPEN) {
          client.send(message)
        } else {
          clients.delete(client)
        }
      }
    },
    async close() {
      if (pingTimer) {
        clearInterval(pingTimer)
        pingTimer = null
      }

      if (!server) {
        return
      }

      for (const client of clients) {
        client.terminate()
      }
      clients.clear()

      await new Promise<void>((resolve, reject) => {
        server?.close((error) => {
          if (error) {
            reject(error)
            return
          }
          resolve()
        })
      })
      server = null
    }
  }
}

