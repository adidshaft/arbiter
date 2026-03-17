import { SKILLS } from '@arbiter/core'
import { Router } from 'express'
import { z } from 'zod'
import { ALL_CHAIN_KEYS } from '../chains.js'
import type { ArbiterStore } from '../models.js'
import { HttpError } from '../utils/errors.js'
import { asyncHandler, sendOk } from '../utils/http.js'
import type { OrchestratorService } from '../services/orchestrator.js'

const executeSchema = z.object({
  skillId: z.string().min(1),
  agentId: z.string().min(1),
  chainKey: z.enum(ALL_CHAIN_KEYS as [typeof ALL_CHAIN_KEYS[number], ...typeof ALL_CHAIN_KEYS]),
  input: z.record(z.unknown()).default({})
})

export function createSkillsRouter(store: ArbiterStore, orchestrator: OrchestratorService): Router {
  const router = Router()

  router.get(
    '/',
    asyncHandler(async (_req, res) => {
      sendOk(res, SKILLS)
    })
  )

  router.post(
    '/execute',
    asyncHandler(async (req, res) => {
      const parsed = executeSchema.parse(req.body)
      sendOk(res, await orchestrator.executeSkill(parsed.agentId, parsed.skillId, parsed.chainKey, parsed.input))
    })
  )

  router.get(
    '/executions',
    asyncHandler(async (_req, res) => {
      sendOk(res, await store.listSkillExecutions())
    })
  )

  router.get(
    '/executions/:id',
    asyncHandler(async (req, res) => {
      const executionId = z.string().parse(req.params.id)
      const execution = await store.getSkillExecution(executionId)
      if (!execution) {
        throw new HttpError(404, 'Execution not found')
      }
      sendOk(res, execution)
    })
  )

  return router
}
