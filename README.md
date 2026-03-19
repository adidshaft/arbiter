# Arbiter

Arbiter is a multi-agent treasury orchestration monorepo. It coordinates agent wallets across six chains, scores contract trust, orchestrates lending and repayment cycles, and streams live activity to a browser dashboard.

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

5. Follow the detailed validation flow in [TESTING.md](./TESTING.md).

6. For live WDK-backed testnet setup, start from [.env.testnet.example](./.env.testnet.example).

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

Arbiter now supports a dedicated `testnet` network mode for the real WDK path.

1. Copy [.env.testnet.example](./.env.testnet.example) into your local `.env`.
2. Set:
   - `NETWORK_MODE=testnet`
   - `USE_MOCK_APIS=false`
   - `VITE_NETWORK_MODE=testnet`
3. Fill in a real `AGENT_ENCRYPTION_KEY`.
4. Fill in `TESTNET_DEPLOYER_PRIVATE_KEY` if you want to deploy your own EVM test tokens.
5. Fill in the RPC URLs for the chains you plan to use.
5. Keep `ETH_SEPOLIA_USDT_ADDRESS=0xd077a400968890eacc75cdc901f0356c943e4fdb` unless the official WDK docs change.
6. Fill in any remaining test token contract addresses you plan to use:
   - `POLYGON_AMOY_USDT_ADDRESS`
   - `ARBITRUM_SEPOLIA_USDT_ADDRESS`
   - `SOLANA_DEVNET_USDT_ADDRESS`
   - `TON_TESTNET_USDT_ADDRESS`
7. Point `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_KEY` at your hosted project if you want persistent storage.
8. If you are sharing a Supabase project with another app, set `SUPABASE_TABLE_PREFIX=arbiter_`.
9. Run `npm run testnet:check` before starting the app.
10. Start the app, create fresh agents, and verify balances before testing transfers or bridges.

In real mode, Arbiter still keeps WDK usage local to the API process and never exposes seed phrases in responses or logs.

### What is already wired up

- testnet-aware RPC switching
- testnet explorer links in the dashboard
- Bitcoin testnet electrum settings
- Ethereum Sepolia USDT configured by default
- real native balance reads through the wallet service
- testnet readiness checks for env, EVM RPCs, and hosted Supabase schema
- deploy and mint scripts for custom EVM 6-decimal test tokens on Sepolia, Amoy, and Arbitrum Sepolia

### What still depends on your environment

- funded wallets on the selected testnets
- valid testnet USDT contracts for Polygon Amoy, Arbitrum Sepolia, Solana devnet, and TON testnet if you want those chains live
- a bridge path that is actually supported by the WDK and hackathon setup

### Shared Supabase project

If you want to reuse the hosted Supabase project from your other desktop repo, Arbiter can point at it directly via `.env`.

- The easiest schema path is to run [001_initial.sql](./supabase/migrations/001_initial.sql) in the Supabase SQL editor.
- If you want prefixed tables for a shared project, render the SQL first:

```bash
npm run supabase:render-sql -- --prefix arbiter_ --out ./supabase/arbiter_shared.sql
```

- Then paste `./supabase/arbiter_shared.sql` into the SQL editor and run it once.
- A ready-made prefixed file is already checked in at [supabase/arbiter_shared.sql](./supabase/arbiter_shared.sql).
- `supabase db push` is not the right first move against that shared project right now, because its migration history already contains the other app's remote migrations.
- `npm run testnet:check` will tell you whether the configured agents table is reachable with your current service key.

### Deploy your own EVM test tokens

If Polygon Amoy or Arbitrum Sepolia do not have an official test USDT address you can verify, you can deploy your own 6-decimal ERC-20 and plug it into Arbiter.

Deploy on Amoy:

```bash
npm run testnet:deploy-token -- --chain polygon --name "Arbiter Amoy USDT" --symbol "aUSDT"
```

Deploy on Arbitrum Sepolia:

```bash
npm run testnet:deploy-token -- --chain arbitrum --name "Arbiter ArbSep USDT" --symbol "aUSDT"
```

Mint more tokens later:

```bash
npm run testnet:mint-token -- --chain polygon --token <TOKEN_ADDRESS> --recipient <WALLET_ADDRESS> --amount 5000
```

Each deploy prints the exact `.env` line to copy back into your config.

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
