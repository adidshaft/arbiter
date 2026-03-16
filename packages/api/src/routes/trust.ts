import { Router } from 'express'
import { z } from 'zod'
import { ALL_CHAIN_KEYS } from '../chains.js'
import type { ArbiterStore } from '../models.js'
import { asyncHandler, sendJson, sendOk } from '../utils/http.js'
import type { OrchestratorService } from '../services/orchestrator.js'

const scoreSchema = z.object({
  contractAddress: z.string().min(1),
  chainKey: z.enum(ALL_CHAIN_KEYS as [typeof ALL_CHAIN_KEYS[number], ...typeof ALL_CHAIN_KEYS])
})

export function createTrustRouter(store: ArbiterStore, orchestrator: OrchestratorService): Router {
  const router = Router()

  router.get(
    '/registry',
    asyncHandler(async (_req, res) => {
      sendOk(res, await store.listTrustRecords())
    })
  )

  router.post(
    '/score',
    asyncHandler(async (req, res) => {
      const parsed = scoreSchema.parse(req.body)
      sendOk(res, await orchestrator.processTrustCheck(parsed.contractAddress, parsed.chainKey))
    })
  )

  router.delete(
    '/:contractAddress',
    asyncHandler(async (req, res) => {
      const contractAddress = z.string().parse(req.params.contractAddress)
      const deleted = await store.deleteTrustRecord(contractAddress)
      sendOk(res, { deleted })
    })
  )

  return router
}
