import { Router } from 'express'
import type { ArbiterStore } from '../models.js'
import { asyncHandler, sendOk } from '../utils/http.js'
import { seedDemoData } from '../seeds/demoData.js'
import type { OrchestratorService } from '../services/orchestrator.js'

export function createDemoRouter(store: ArbiterStore, orchestrator: OrchestratorService): Router {
  const router = Router()

  router.post(
    '/demo/run-cycle',
    asyncHandler(async (_req, res) => {
      const loan = await orchestrator.runFullLendingCycle({
        borrowerAgentId: 'agent_beta',
        amount: 35,
        chainKey: 'POLYGON',
        targetContract: '0xfeed000000000000000000000000000000000001',
        taskDescription: 'Execute a same-chain treasury routine'
      })
      sendOk(res, loan)
    })
  )

  router.post(
    '/demo/red-contract',
    asyncHandler(async (_req, res) => {
      const record = await orchestrator.processTrustCheck('0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef', 'POLYGON')
      sendOk(res, { record, alerts: await store.listAlerts() })
    })
  )

  router.post(
    '/demo/cross-chain',
    asyncHandler(async (_req, res) => {
      const loan = await orchestrator.runFullLendingCycle({
        borrowerAgentId: 'agent_beta',
        amount: 60,
        chainKey: 'ARBITRUM',
        targetContract: '0xfeed000000000000000000000000000000000002',
        taskDescription: 'Execute a cross-chain treasury routine'
      })
      sendOk(res, loan)
    })
  )

  router.post(
    '/demo/reset',
    asyncHandler(async (_req, res) => {
      await store.reset()
      await seedDemoData(store)
      sendOk(res, { reset: true, agents: await store.listAgents() })
    })
  )

  return router
}

