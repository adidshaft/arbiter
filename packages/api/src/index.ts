import http from 'node:http'
import { readEnv } from './config/env.js'
import { createStore } from './db/client.js'
import { seedDemoData } from './seeds/demoData.js'
import { createApp } from './app.js'
import { createOrchestrator } from './services/orchestrator.js'
import { createWebSocketHub } from './websocket.js'

const env = readEnv()
const store = createStore()
const ws = createWebSocketHub()
const orchestrator = createOrchestrator(store, ws)
const app = createApp(env, store, orchestrator, ws)
const server = http.createServer(app)

ws.attach(server)

const bootstrap = async (): Promise<void> => {
  if (store.mode === 'memory') {
    await seedDemoData(store)
  }

  await orchestrator.evaluateOverdueLoans()
}

const overdueTimer = setInterval(() => {
  void orchestrator.evaluateOverdueLoans()
}, 5 * 60 * 1000)

void bootstrap().then(() => {
  server.listen(env.PORT, () => {
    console.log(`Arbiter API listening on http://localhost:${env.PORT}`)
  })
})

const shutdown = async (): Promise<void> => {
  clearInterval(overdueTimer)
  await ws.close()
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error)
        return
      }
      resolve()
    })
  })
}

process.on('SIGINT', () => {
  void shutdown().finally(() => process.exit(0))
})

process.on('SIGTERM', () => {
  void shutdown().finally(() => process.exit(0))
})

