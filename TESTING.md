# Testing Arbiter

This guide covers both the default mock-mode review flow and the new testnet-ready setup.

## Mock mode checklist

1. Install dependencies:

```bash
npm install
```

2. Run builds and tests:

```bash
npm run build
npm run test
```

3. Start the app:

```bash
npm run dev
```

4. Verify the API:

```bash
curl http://localhost:3001/api/health
curl http://localhost:3001/api/agents
curl http://localhost:3001/api/trust/registry
curl http://localhost:3001/api/skills
curl -X POST http://localhost:3001/api/demo/run-cycle
curl -X POST http://localhost:3001/api/demo/red-contract
curl -X POST http://localhost:3001/api/demo/cross-chain
```

5. Verify the dashboard:

- open `http://localhost:5173`
- confirm 3 seeded agents are visible
- confirm Fleet, Lending, Trust, Skills, and Config routes render
- run the demo endpoints and confirm the UI updates
- use the kill switch and confirm all agents pause

## Testnet mode checklist

1. Copy [.env.testnet.example](./.env.testnet.example) to your local `.env`.
2. Confirm these values:

```env
NETWORK_MODE=testnet
USE_MOCK_APIS=false
VITE_NETWORK_MODE=testnet
```

3. Fill in:

- `AGENT_ENCRYPTION_KEY`
- `TESTNET_DEPLOYER_PRIVATE_KEY` if you want to deploy your own EVM test tokens
- `SUPABASE_TABLE_PREFIX=arbiter_` if you are sharing a Supabase project with another app
- the RPC URLs you want to use
- any missing testnet USDT contract addresses for the chains you want live

4. Start with Ethereum Sepolia first.

The repo already includes a Sepolia USDT default:

```env
ETH_SEPOLIA_USDT_ADDRESS=0xd077a400968890eacc75cdc901f0356c943e4fdb
```

5. Start the app:

```bash
npm run testnet:check
npm run dev
```

6. Create fresh agents after switching to testnet mode.

7. Validate chain-by-chain:

- wallet addresses are created
- explorer links point to testnet explorers
- native balances are non-zero where funded
- USDT balances resolve on chains where you configured test token contracts

8. Test in this order:

- balance reads
- same-chain transfer on Ethereum Sepolia
- same-chain transfer on any additional configured chain
- EVM bridge flow only after transfers are working

## Current testnet support in repo

Already implemented:

- `NETWORK_MODE=mainnet|testnet`
- `VITE_NETWORK_MODE=mainnet|testnet`
- testnet-aware RPC switching in the API WDK runtime
- testnet-aware explorer links in the dashboard
- Bitcoin testnet electrum configuration
- Ethereum Sepolia USDT default address
- real native balance reads through the wallet service
- a hosted Supabase schema reachability check
- deploy and mint scripts for your own EVM test tokens

Still environment-dependent:

- Polygon Amoy USDT address
- Arbitrum Sepolia USDT address
- Solana devnet token address
- TON testnet token address
- the exact bridge path supported by the hackathon environment

## Safety checks

- seed phrases must never appear in API responses
- seed phrases must never appear in logs
- all WDK package imports remain isolated to `packages/api/src/services/wdk/walletService.ts`
- real-mode testing should use funded testnet wallets only

## Troubleshooting

If `npm run dev` fails because a port is taken:

```bash
lsof -i :3001
lsof -i :5173
```

If balances stay at zero in testnet mode:

- confirm the wallet is funded on that testnet
- confirm the RPC URL is correct
- confirm the chain’s testnet USDT address is configured

If `npm run testnet:check` says the Supabase schema is missing:

- if you are sharing a project, keep `SUPABASE_TABLE_PREFIX=arbiter_`
- render a prefixed SQL file with `npm run supabase:render-sql -- --prefix arbiter_ --out ./supabase/arbiter_shared.sql`
- open the hosted project SQL editor
- run [supabase/arbiter_shared.sql](./supabase/arbiter_shared.sql), or [001_initial.sql](./supabase/migrations/001_initial.sql) if you are using an empty project
- run `npm run testnet:check` again

If you do not have official Amoy or Arbitrum Sepolia test token addresses:

- deploy your own token with `npm run testnet:deploy-token -- --chain polygon`
- or `npm run testnet:deploy-token -- --chain arbitrum`
- copy the printed address into `.env`

If transfers fail on a non-EVM chain:

- that is expected for the current real transfer implementation
- the real transfer path is EVM-focused

If bridging fails:

- verify the source chain is EVM
- verify the source chain has a configured USDT contract
- verify the bridge route is actually supported by the WDK/testnet environment you are using
