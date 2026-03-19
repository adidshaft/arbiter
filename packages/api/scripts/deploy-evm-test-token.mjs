import { ContractFactory, Wallet, formatUnits, parseUnits } from 'ethers'
import solc from 'solc'

import {
  ensureTestnetMode,
  getSuggestedTokenEnv,
  parseArgs,
  readRequiredEnv,
  verifyRpcConnection,
} from './_shared.mjs'
import { EVM_TEST_TOKEN_SOURCE } from './evm-test-token-source.mjs'

function compileContract() {
  const input = {
    language: 'Solidity',
    sources: {
      'ArbiterTestUsdt.sol': {
        content: EVM_TEST_TOKEN_SOURCE,
      },
    },
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode.object'],
        },
      },
    },
  }

  const output = JSON.parse(solc.compile(JSON.stringify(input)))
  const errors = Array.isArray(output.errors) ? output.errors : []
  const fatal = errors.find((error) => error.severity === 'error')
  if (fatal) {
    throw new Error(fatal.formattedMessage)
  }

  const contract = output.contracts['ArbiterTestUsdt.sol']?.ArbiterTestUsdt
  if (!contract?.abi || !contract.evm?.bytecode?.object) {
    throw new Error('Unable to compile ArbiterTestUsdt')
  }

  return {
    abi: contract.abi,
    bytecode: `0x${contract.evm.bytecode.object}`,
  }
}

async function main() {
  ensureTestnetMode()

  const args = parseArgs(process.argv.slice(2))
  const chain = args.chain ?? 'polygon'
  const name = args.name ?? 'Arbiter Test USDT'
  const symbol = args.symbol ?? 'arbUSDT'
  const supply = args.supply ?? '1000000'
  const privateKey = readRequiredEnv('TESTNET_DEPLOYER_PRIVATE_KEY')

  const { provider, network } = await verifyRpcConnection(chain)
  const wallet = new Wallet(privateKey, provider)
  const recipient = args.recipient ?? wallet.address
  const initialSupplyRaw = parseUnits(String(supply), 6)
  const { abi, bytecode } = compileContract()

  const factory = new ContractFactory(abi, bytecode, wallet)
  const contract = await factory.deploy(name, symbol, recipient, initialSupplyRaw)
  await contract.waitForDeployment()
  const address = await contract.getAddress()
  const tokenEnv = getSuggestedTokenEnv(chain)

  console.log(`Chain: ${chain}`)
  console.log(`Network chainId: ${network.chainId.toString()}`)
  console.log(`Token address: ${address}`)
  console.log(`Owner: ${wallet.address}`)
  console.log(`Initial recipient: ${recipient}`)
  console.log(`Initial supply: ${formatUnits(initialSupplyRaw, 6)} ${symbol}`)
  console.log(`Suggested .env line: ${tokenEnv}=${address}`)
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(message)
  process.exitCode = 1
})
