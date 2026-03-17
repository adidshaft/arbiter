import type { OrchestratorEvent } from '@arbiter/core'
import type { ArbiterStore } from '../models.js'
import { createId } from '../utils/ids.js'
import type { WebSocketHub } from '../websocket.js'

export async function publishEvent(
  store: ArbiterStore,
  ws: WebSocketHub,
  type: OrchestratorEvent['type'],
  payload: Record<string, unknown>
): Promise<OrchestratorEvent> {
  const event: OrchestratorEvent = {
    id: createId('evt'),
    type,
    payload,
    timestamp: new Date()
  }
  const stored = await store.createEvent(event)
  ws.broadcast(type, payload)
  return stored
}

