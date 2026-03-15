import { calculateLoanTerms, defaultCreditHistory, type TrustScore } from '@arbiter/core'
import { Router } from 'express'
import { z } from 'zod'
import { ALL_CHAIN_KEYS } from '../chains.js'
import type { ArbiterStore } from '../models.js'
import { HttpError } from '../utils/errors.js'
import { asyncHandler, sendOk } from '../utils/http.js'
import { calculateLendingPool } from '../services/fleet.js'
import type { OrchestratorService } from '../services/orchestrator.js'

const requestSchema = z.object({
  borrowerAgentId: z.string().min(1),
  amount: z.number().positive(),
  chainKey: z.enum(ALL_CHAIN_KEYS as [typeof ALL_CHAIN_KEYS[number], ...typeof ALL_CHAIN_KEYS]),
  targetContract: z.string().min(1),
  taskDescription: z.string().min(1)
})

const simulateSchema = z.object({
  principal: z.number().positive(),
  trustScore: z.enum(['GREEN', 'YELLOW', 'RED', 'UNKNOWN']),
  agentId: z.string().optional()
})

export function createLendingRouter(store: ArbiterStore, orchestrator: OrchestratorService): Router {
  const router = Router()

  router.get(
    '/loans',
    asyncHandler(async (_req, res) => {
      sendOk(res, await store.listLoans())
    })
  )

  router.post(
    '/request',
    asyncHandler(async (req, res) => {
      const parsed = requestSchema.parse(req.body)
      const loan = await orchestrator.createRequestedLoan(parsed)
      const finalized = loan.status === 'rejected' ? loan : await orchestrator.disburseLoan(loan.id)
      sendOk(res, finalized)
    })
  )

  router.get(
    '/pool',
    asyncHandler(async (_req, res) => {
      sendOk(res, await calculateLendingPool(store))
    })
  )

  router.get(
    '/credit/:agentId',
    asyncHandler(async (req, res) => {
      const agentId = z.string().parse(req.params.agentId)
      const history = (await store.getCreditHistory(agentId)) ?? defaultCreditHistory(agentId)
      sendOk(res, history)
    })
  )

  router.post(
    '/simulate',
    asyncHandler(async (req, res) => {
      const parsed = simulateSchema.parse(req.body)
      const pool = await calculateLendingPool(store)
      const creditHistory = parsed.agentId
        ? (await store.getCreditHistory(parsed.agentId)) ?? defaultCreditHistory(parsed.agentId)
        : defaultCreditHistory('simulation')
      const terms = calculateLoanTerms(parsed.principal, parsed.trustScore as TrustScore, creditHistory, pool.utilizationRate)
      sendOk(res, { terms, pool })
    })
  )

  router.post(
    '/:loanId/repay',
    asyncHandler(async (req, res) => {
      const loanId = z.string().parse(req.params.loanId)
      const loan = await store.getLoan(loanId)
      if (!loan) {
        throw new HttpError(404, 'Loan not found')
      }
      sendOk(res, await orchestrator.triggerRepayment(loan.id))
    })
  )

  return router
}
