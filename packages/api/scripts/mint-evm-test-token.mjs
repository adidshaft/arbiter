import { Contract, Wallet, formatUnits, parseUnits } from 'ethers'
import solc from 'solc'

import { ensureTestnetMode, parseArgs, readRequiredEnv, verifyRpcConnection } from './_shared.mjs'
import { EVM_TEST_TOKEN_SOURCE } from './evm-test-token-source.mjs'

function compileAbi() {
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
          '*': ['abi'],
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
  if (!contract?.abi) {
    throw new Error('Unable to compile ArbiterTestUsdt ABI')
  }

  return contract.abi
}

async function main() {
  ensureTestnetMode()

  const args = parseArgs(process.argv.slice(2))
  const chain = args.chain ?? 'polygon'
  const tokenAddress = args.token
  const recipient = args.recipient
  const amount = args.amount ?? '1000'

  if (!tokenAddress) {
    throw new Error('Pass the token contract with --token <address>')
  }

  if (!recipient) {
    throw new Error('Pass the recipient wallet with --recipient <address>')
  }

  const privateKey = readRequiredEnv('TESTNET_DEPLOYER_PRIVATE_KEY')
  const { provider, network } = await verifyRpcConnection(chain)
  const wallet = new Wallet(privateKey, provider)
  const abi = compileAbi()
  const contract = new Contract(tokenAddress, abi, wallet)
  const amountRaw = parseUnits(String(amount), 6)
  const tx = await contract.mint(recipient, amountRaw)
  await tx.wait()

  console.log(`Chain: ${chain}`)
  console.log(`Network chainId: ${network.chainId.toString()}`)
  console.log(`Token address: ${tokenAddress}`)
  console.log(`Recipient: ${recipient}`)
  console.log(`Minted: ${formatUnits(amountRaw, 6)}`)
  console.log(`Transaction: ${tx.hash}`)
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(message)
  process.exitCode = 1
})
