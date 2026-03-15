import { defaultCreditHistory, type AgentConfig, type AgentStatus } from '@arbiter/core'
import { Router } from 'express'
import { z } from 'zod'
import { ALL_CHAIN_KEYS, toCoreChain } from '../chains.js'
import type { AgentRecord, ArbiterStore } from '../models.js'
import { createId } from '../utils/ids.js'
import { HttpError } from '../utils/errors.js'
import { asyncHandler, sendJson, sendOk } from '../utils/http.js'
import { publishEvent } from '../services/events.js'
import { defaultAgentConfig, refreshAgentBalances, sanitizeAgent } from '../services/fleet.js'
import { createAgentWallet, generateAgentSeedPhrase } from '../services/wdk/walletService.js'
import type { WebSocketHub } from '../websocket.js'

const createAgentSchema = z.object({
  name: z.string().min(1),
  role: z.enum(['lender', 'borrower', 'executor', 'orchestrator']),
  config: z
    .object({
      maxTransactionSize: z.number().positive(),
      dailySpendingCap: z.number().positive(),
      lendingOptIn: z.boolean(),
      minBalanceFloor: z.number().nonnegative(),
      preferredChains: z.array(z.enum(ALL_CHAIN_KEYS as [typeof ALL_CHAIN_KEYS[number], ...typeof ALL_CHAIN_KEYS])),
      allowedContracts: z.array(z.string()),
      blockedContracts: z.array(z.string())
    })
    .partial()
    .optional()
})

const configSchema = createAgentSchema.shape.config.unwrap()
const statusSchema = z.object({ status: z.enum(['idle', 'executing', 'lending', 'borrowing', 'paused']) })

function mergeConfig(config?: Partial<AgentConfig>): AgentConfig {
  const defaults = defaultAgentConfig()
  return {
    maxTransactionSize: config?.maxTransactionSize ?? defaults.maxTransactionSize,
    dailySpendingCap: config?.dailySpendingCap ?? defaults.dailySpendingCap,
    lendingOptIn: config?.lendingOptIn ?? defaults.lendingOptIn,
    minBalanceFloor: config?.minBalanceFloor ?? defaults.minBalanceFloor,
    preferredChains: [...(config?.preferredChains ?? defaults.preferredChains)],
    allowedContracts: [...(config?.allowedContracts ?? defaults.allowedContracts)],
    blockedContracts: [...(config?.blockedContracts ?? defaults.blockedContracts)]
  }
}

export function createAgentsRouter(store: ArbiterStore, ws: WebSocketHub): Router {
  const router = Router()

  router.get(
    '/',
    asyncHandler(async (_req, res) => {
      const agents = await store.listAgents()
      sendOk(res, agents.map(sanitizeAgent))
    })
  )

  router.post(
    '/',
    asyncHandler(async (req, res) => {
      const parsed = createAgentSchema.parse(req.body)
      const id = createId('agent')
      const seedPhrase = generateAgentSeedPhrase()
      const walletResult = await createAgentWallet({ agentId: id, seedPhrase })
      const now = new Date()
      const agent: AgentRecord = {
        id,
        name: parsed.name,
        role: parsed.role,
        status: 'idle',
        config: mergeConfig(parsed.config),
        creditScore: 500,
        wallets: walletResult.wallets.reduce<AgentRecord['wallets']>((accumulator, wallet) => {
          const chainKey = toCoreChain(wallet.chainKey)
          accumulator[chainKey] = { chainKey, address: wallet.address }
          return accumulator
        }, {}),
        encryptedSeed: walletResult.encryptedSeed,
        createdAt: now,
        updatedAt: now
      }

      await store.createAgent(agent)
      await store.upsertCreditHistory(defaultCreditHistory(agent.id))
      await refreshAgentBalances(store, agent)
      await publishEvent(store, ws, 'skill_executed', { agentId: agent.id, action: 'wallet_provisioned' })
      sendJson(res, 201, sanitizeAgent(agent))
    })
  )

  router.get(
    '/:id',
    asyncHandler(async (req, res) => {
      const agentId = z.string().parse(req.params.id)
      const resolvedAgent = await store.getAgent(agentId)
      if (!resolvedAgent) {
        throw new HttpError(404, 'Agent not found')
      }
      sendOk(res, sanitizeAgent(resolvedAgent))
    })
  )

  router.patch(
    '/:id/config',
    asyncHandler(async (req, res) => {
      const parsed = configSchema.parse(req.body)
      const agentId = z.string().parse(req.params.id)
      const agent = await store.getAgent(agentId)
      if (!agent) {
        throw new HttpError(404, 'Agent not found')
      }
      const updated = await store.updateAgent(agent.id, { config: mergeConfig({ ...agent.config, ...parsed }) })
      if (!updated) {
        throw new HttpError(500, 'Unable to update agent config')
      }
      sendOk(res, sanitizeAgent(updated))
    })
  )

  router.patch(
    '/:id/status',
    asyncHandler(async (req, res) => {
      const parsed = statusSchema.parse(req.body)
      const agentId = z.string().parse(req.params.id)
      const updated = await store.updateAgent(agentId, { status: parsed.status as AgentStatus })
      if (!updated) {
        throw new HttpError(404, 'Agent not found')
      }
      if (parsed.status === 'paused') {
        await publishEvent(store, ws, 'agent_paused', { agentId: updated.id })
      }
      sendOk(res, sanitizeAgent(updated))
    })
  )

  router.delete(
    '/:id',
    asyncHandler(async (req, res) => {
      const agentId = z.string().parse(req.params.id)
      const deleted = await store.deleteAgent(agentId)
      if (!deleted) {
        throw new HttpError(404, 'Agent not found')
      }
      sendJson(res, 204, {})
    })
  )

  router.post(
    '/pause-all',
    asyncHandler(async (_req, res) => {
      const paused = await store.pauseAllAgents()
      await publishEvent(store, ws, 'kill_switch', { pausedAgentIds: paused.map((agent) => agent.id) })
      sendOk(res, paused.map(sanitizeAgent))
    })
  )

  router.post(
    '/:id/refresh-balances',
    asyncHandler(async (req, res) => {
      const agentId = z.string().parse(req.params.id)
      const agent = await store.getAgent(agentId)
      if (!agent) {
        throw new HttpError(404, 'Agent not found')
      }
      const balances = await refreshAgentBalances(store, agent)
      sendOk(res, balances)
    })
  )

  return router
}
