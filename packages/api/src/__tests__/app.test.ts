import { describe, expect, it, beforeEach } from 'vitest'
import request from 'supertest'
import { readEnv } from '../config/env.js'
import { createApp } from '../app.js'
import { createMemoryStore } from '../db/memoryStore.js'
import { seedDemoData } from '../seeds/demoData.js'
import { createOrchestrator } from '../services/orchestrator.js'
import { createWebSocketHub } from '../websocket.js'

describe('arbiter api', () => {
  const env = readEnv()
  const store = createMemoryStore()
  const ws = createWebSocketHub()
  const orchestrator = createOrchestrator(store, ws)
  const app = createApp(env, store, orchestrator, ws)

  beforeEach(async () => {
    await store.reset()
    await seedDemoData(store)
  })

  it('returns health payload', async () => {
    const response = await request(app).get('/api/health')
    expect(response.status).toBe(200)
    expect(response.body).toEqual({ status: 'ok', mock: true, chains: 6 })
  })

  it('lists seeded agents', async () => {
    const response = await request(app).get('/api/agents')
    expect(response.status).toBe(200)
    expect(response.body).toHaveLength(3)
  })

  it('lists trust records and skills', async () => {
    const trustResponse = await request(app).get('/api/trust/registry')
    expect(trustResponse.status).toBe(200)
    expect(trustResponse.body.length).toBeGreaterThanOrEqual(5)

    const skillsResponse = await request(app).get('/api/skills')
    expect(skillsResponse.status).toBe(200)
    expect(skillsResponse.body.length).toBeGreaterThanOrEqual(5)
  })

  it('runs demo routes', async () => {
    const cycleResponse = await request(app).post('/api/demo/run-cycle')
    expect(cycleResponse.status).toBe(200)
    expect(cycleResponse.body.status).toBe('repaid')

    const redResponse = await request(app).post('/api/demo/red-contract')
    expect(redResponse.status).toBe(200)
    expect(redResponse.body.record.score).toBe('RED')

    const crossChainResponse = await request(app).post('/api/demo/cross-chain')
    expect(crossChainResponse.status).toBe(200)
    expect(crossChainResponse.body.isCrossChain).toBe(true)
  }, 30000)
})
