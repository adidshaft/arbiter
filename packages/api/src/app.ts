import cors from 'cors'
import express, { type Express, type NextFunction, type Request, type Response } from 'express'
import helmet from 'helmet'
import { SUPPORTED_CHAINS } from '@arbiter/core'
import type { ApiEnv } from './config/env.js'
import type { ArbiterStore } from './models.js'
import { createAgentsRouter } from './routes/agents.js'
import { createDemoRouter } from './routes/demo.js'
import { createLendingRouter } from './routes/lending.js'
import { createSkillsRouter } from './routes/skills.js'
import { createTrustRouter } from './routes/trust.js'
import type { OrchestratorService } from './services/orchestrator.js'
import { sendJson, sendOk } from './utils/http.js'
import { HttpError } from './utils/errors.js'
import type { WebSocketHub } from './websocket.js'

export function createApp(env: ApiEnv, store: ArbiterStore, orchestrator: OrchestratorService, ws: WebSocketHub): Express {
  const app = express()

  app.use(helmet())
  app.use(cors())
  app.use(express.json())

  app.get('/api/health', (_req, res) => {
    sendOk(res, { status: 'ok', mock: store.mode === 'memory', chains: Object.keys(SUPPORTED_CHAINS).length })
  })

  app.get('/api/balances', async (_req, res) => {
    sendOk(res, await store.listBalances())
  })

  app.get('/api/balances/:agentId', async (req, res) => {
    sendOk(res, await store.listBalancesByAgent(req.params.agentId))
  })

  app.get('/api/alerts', async (_req, res) => {
    sendOk(res, await store.listAlerts())
  })

  app.post('/api/alerts/:id/dismiss', async (req, res) => {
    const alert = await store.updateAlert(req.params.id, { dismissed: true })
    if (!alert) {
      throw new HttpError(404, 'Alert not found')
    }
    sendOk(res, alert)
  })

  app.get('/api/events', async (_req, res) => {
    sendOk(res, await store.listEvents())
  })

  app.use('/api/agents', createAgentsRouter(store, ws))
  app.use('/api', createLendingRouter(store, orchestrator))
  app.use('/api/trust', createTrustRouter(store, orchestrator))
  app.use('/api/skills', createSkillsRouter(store, orchestrator))
  app.use('/api', createDemoRouter(store, orchestrator))

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof HttpError) {
      sendJson(res, error.statusCode, { error: error.message })
      return
    }

    const message = error instanceof Error ? error.message : 'Internal server error'
    sendJson(res, 500, { error: message })
  })

  return app
}

