# Arbiter

Arbiter is a multi-agent treasury orchestration monorepo built for Hackathon Galáctica: WDK Edition 1 by Tether. It coordinates agent wallets across six chains, scores contract trust, orchestrates lending and repayment cycles, and streams live activity to a browser dashboard.

## What is included

- `packages/core` for shared domain types, lending math, credit scoring, trust refresh logic, and skill definitions.
- `packages/api` for the Express API, in-memory/Supabase data access, orchestration, websocket broadcasting, demo seeds, and the WDK wallet adapter.
- `packages/dashboard` for the Vite React terminal dashboard that visualizes fleet health, lending, trust, skills, and agent configuration.

## Why this repo exists

This project was built to demonstrate an autonomous treasury workflow for hackathon evaluation:

- agents can be provisioned with wallets on Ethereum, Polygon, Arbitrum, Solana, TON, and Bitcoin
- lending requests are matched against available capital and trust scores
- repayments, alerts, and execution events are broadcast in real time
- the dashboard is usable in the browser, not just as a backend demo

## Tech stack

- TypeScript in strict mode
- npm workspaces
- Express
- WebSocket server via `ws`
- Supabase-compatible persistence with an in-memory fallback
- OpenAI trust scoring fallback pipeline
- Vite, React, React Router, TanStack Query, Recharts, Tailwind, and `react-hot-toast`
- WDK local self-custodial wallet modules from `@tetherto/*`

## Supported chains

- Ethereum
- Polygon
- Arbitrum
- Solana
- TON
- Bitcoin

## Quick start

1. Install dependencies:

```bash
npm install
```

2. Start the API and dashboard:

```bash
npm run dev
```

3. Open the dashboard and API:

- Dashboard: `http://localhost:5173`
- API: `http://localhost:3001`

4. Build and run the workspace checks:

```bash
npm run build
npm run test
```

## Mock mode

Arbiter runs in mock mode by default with `USE_MOCK_APIS=true`. In this mode:

- no live RPC calls are required
- wallet behavior is deterministic and fully in memory
- demo flows work immediately after install
- the app can be evaluated without secrets or testnet funding

This is the recommended mode for local development and hackathon judging.

## WDK notes

WDK is local and self-custodial. Arbiter does not use a WDK cloud backend, WDK API key, or remote WDK service.

The wallet integration uses these packages:

- `@tetherto/wdk`
- `@tetherto/wdk-wallet-evm`
- `@tetherto/wdk-wallet-solana`
- `@tetherto/wdk-wallet-ton`
- `@tetherto/wdk-wallet-btc`
- `@tetherto/wdk-protocol-bridge-usdt0-evm`

## Demo curls

Run these against the API while the app is in mock mode:

```bash
curl http://localhost:3001/api/health
```

```bash
curl -X POST http://localhost:3001/api/demo/run-cycle
```

```bash
curl -X POST http://localhost:3001/api/demo/red-contract
```

```bash
curl -X POST http://localhost:3001/api/demo/cross-chain
```

## Real testnet setup

1. Set `USE_MOCK_APIS=false` in your environment.
2. Provide real RPC URLs for the chains you want to use.
3. Set a valid `AGENT_ENCRYPTION_KEY` and keep it private.
4. Replace placeholder Supabase values if you want persistent storage.
5. Start the API and create agents from the dashboard.
6. Confirm the target wallets and balances before enabling live execution.

In real mode, Arbiter still keeps WDK usage local to the API process and never exposes seed phrases in responses or logs.

## Project structure

```text
packages/
  core/       shared domain model and scoring logic
  api/        Express API, WDK adapter, persistence, orchestration
  dashboard/  browser UI and websocket client
supabase/
  migrations/ database schema
```

## Hackathon alignment

Arbiter fits the hackathon goal of building practical infrastructure for cross-chain treasury automation:

- treasury automation through agent orchestration
- self-custodial wallet management with WDK
- trust-aware lending and execution controls
- real-time visibility through a browser dashboard

## Docker

Build and run the local development stack:

```bash
docker compose up --build
```

The compose file starts the API and dashboard containers with the same environment defaults used for local mock-mode development.
