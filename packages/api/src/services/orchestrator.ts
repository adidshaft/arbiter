import {
  SKILLS,
  calculateLoanTerms,
  defaultCreditHistory,
  getSkillById,
  scoreContractTrust,
  shouldRefresh,
  updateCreditHistory,
  type AgentBalance,
  type Alert,
  type ChainKey,
  type ContractTrustRecord,
  type CreditHistory,
  type Loan,
  type LoanRequest,
  type OrchestratorEvent,
  type SkillExecution
} from '@arbiter/core'
import { ALL_CHAIN_KEYS, isEvmChain, toWalletChain, usdtNumberToRaw, usdtRawToNumber } from '../chains.js'
import type { AgentRecord, ArbiterStore } from '../models.js'
import { createId } from '../utils/ids.js'
import { explorerUrl, calculateLendingPool, refreshAgentBalances } from './fleet.js'
import { bridgeUsdtCrossChain, transferUsdt } from './wdk/walletService.js'
import type { WebSocketHub } from '../websocket.js'

export interface LendingCycleInput {
  borrowerAgentId: string
  amount: number
  chainKey: ChainKey
  targetContract: string
  taskDescription: string
}

function deterministicVolume(contractAddress: string, chainKey: ChainKey): number {
  const seed = `${contractAddress.toLowerCase()}:${chainKey}`
  let total = 0
  for (const char of seed) {
    total = (total * 31 + char.charCodeAt(0)) % 150_000
  }
  return 25_000 + total
}

function activeLoanStatus(status: Loan['status']): boolean {
  return status === 'approved' || status === 'disbursed' || status === 'executing' || status === 'repaying'
}

export class OrchestratorService {
  constructor(private readonly store: ArbiterStore, private readonly ws: WebSocketHub) {}

  private async emit(type: OrchestratorEvent['type'], payload: Record<string, unknown>): Promise<OrchestratorEvent> {
    const event: OrchestratorEvent = {
      id: createId('evt'),
      type,
      payload,
      timestamp: new Date()
    }
    const stored = await this.store.createEvent(event)
    this.ws.broadcast(type, {
      ...stored.payload,
      eventId: stored.id,
      eventTimestamp: stored.timestamp.toISOString()
    })
    return stored
  }

  private async createAlert(alert: Alert): Promise<Alert> {
    const stored = await this.store.createAlert(alert)
    await this.emit('alert_created', {
      id: stored.id,
      alertId: stored.id,
      agentId: stored.agentId,
      type: stored.type,
      severity: stored.severity,
      message: stored.message,
      metadata: stored.metadata,
      dismissed: stored.dismissed,
      createdAt: stored.createdAt.toISOString()
    })
    return stored
  }

  async matchLoan(request: LoanRequest): Promise<{ lender: AgentRecord; balance: AgentBalance; isCrossChain: boolean } | null> {
    const agents = await this.store.listAgents()
    const balances = await this.store.listBalances()
    const lenders = agents.filter((agent) => agent.config.lendingOptIn && agent.status === 'idle')

    const candidates = lenders.flatMap((lender) =>
      balances
        .filter((balance) => balance.agentId === lender.id)
        .filter((balance) => usdtRawToNumber(balance.usdtRaw, balance.chainKey) > lender.config.minBalanceFloor + request.amount)
        .map((balance) => ({
          lender,
          balance,
          sameChain: balance.chainKey === request.chainKey
        }))
    )

    if (candidates.length === 0) {
      return null
    }

    candidates.sort((left, right) => {
      if (left.sameChain !== right.sameChain) {
        return left.sameChain ? -1 : 1
      }
      return usdtRawToNumber(right.balance.usdtRaw, right.balance.chainKey) - usdtRawToNumber(left.balance.usdtRaw, left.balance.chainKey)
    })

    const best = candidates[0]
    if (!best) {
      return null
    }
    return {
      lender: best.lender,
      balance: best.balance,
      isCrossChain: best.balance.chainKey !== request.chainKey
    }
  }

  async processTrustCheck(contractAddress: string, chainKey: ChainKey): Promise<ContractTrustRecord> {
    const existing = await this.store.findTrustRecord(contractAddress, chainKey)
    const currentVolumeUsd = deterministicVolume(contractAddress, chainKey)

    if (existing && !shouldRefresh(existing, { currentVolumeUsd, now: new Date() })) {
      return existing
    }

    const context = existing ? { existingRecord: existing, currentVolumeUsd, now: new Date() } : { currentVolumeUsd, now: new Date() }
    const record = await scoreContractTrust({ contractAddress, chainKey, forceRefresh: Boolean(existing) }, context)

    const stored = await this.store.upsertTrustRecord({
      ...record,
      contractAddress,
      chainKey,
      ...(existing ? { refreshTrigger: 'stale_or_volume' } : {})
    })
    await this.emit('trust_scored', {
      contractAddress: stored.contractAddress,
      chainKey: stored.chainKey,
      score: stored.score,
      confidence: stored.confidence
    })

    if (stored.score === 'RED' && !existing) {
      const agents = await this.store.listAgents()
      const owner = agents[0]
      if (owner) {
        await this.createAlert({
          id: createId('alert'),
          type: 'red_contract_unknown',
          severity: 'critical',
          agentId: owner.id,
          message: `RED trust score detected for ${contractAddress}`,
          metadata: { contractAddress, chainKey },
          dismissed: false,
          createdAt: new Date()
        })
      }
    }

    return stored
  }

  async createRequestedLoan(input: LendingCycleInput): Promise<Loan> {
    const borrower = await this.store.getAgent(input.borrowerAgentId)
    if (!borrower) {
      throw new Error('Borrower agent not found')
    }

    const request: LoanRequest = {
      id: createId('req'),
      borrowerAgentId: borrower.id,
      amount: input.amount,
      chainKey: input.chainKey,
      targetContract: input.targetContract,
      taskDescription: input.taskDescription,
      requestedAt: new Date()
    }

    await this.emit('loan_requested', {
      requestId: request.id,
      borrowerAgentId: request.borrowerAgentId,
      borrowerName: borrower.name,
      amount: request.amount,
      chainKey: request.chainKey
    })

    const lenderMatch = await this.matchLoan(request)
    if (!lenderMatch) {
      throw new Error('No available lender matched this request')
    }

    const trustRecord = await this.processTrustCheck(request.targetContract, request.chainKey)
    const credit = (await this.store.getCreditHistory(request.borrowerAgentId)) ?? defaultCreditHistory(request.borrowerAgentId)
    const pool = await calculateLendingPool(this.store)
    const terms = calculateLoanTerms(request.amount, trustRecord.score, credit, pool.utilizationRate)

    if (!terms) {
      const rejectedLoan: Loan = {
        id: createId('loan'),
        requestId: request.id,
        lenderAgentId: lenderMatch.lender.id,
        borrowerAgentId: request.borrowerAgentId,
        principal: 0,
        interestRate: 0,
        interestAmount: 0,
        totalRepayment: 0,
        chainKey: request.chainKey,
        targetContract: request.targetContract,
        trustScore: trustRecord.score,
        status: 'rejected',
        isCrossChain: lenderMatch.isCrossChain,
        lenderChainKey: lenderMatch.balance.chainKey,
        createdAt: new Date(),
        dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
      const storedRejectedLoan = await this.store.createLoan(rejectedLoan)
      await this.emit('loan_rejected', {
        loanId: storedRejectedLoan.id,
        requestId: request.id,
        borrowerAgentId: borrower.id,
        borrowerName: borrower.name,
        chainKey: request.chainKey,
        amount: request.amount,
        trustScore: trustRecord.score
      })
      return storedRejectedLoan
    }

    const loan: Loan = {
      id: createId('loan'),
      requestId: request.id,
      lenderAgentId: lenderMatch.lender.id,
      borrowerAgentId: request.borrowerAgentId,
      principal: terms.approvedAmount,
      interestRate: terms.interestRate,
      interestAmount: terms.interestAmount,
      totalRepayment: terms.totalRepayment,
      chainKey: request.chainKey,
      targetContract: request.targetContract,
      trustScore: trustRecord.score,
      status: 'approved',
      isCrossChain: lenderMatch.isCrossChain,
      lenderChainKey: lenderMatch.balance.chainKey,
      createdAt: new Date(),
      dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }

    const storedLoan = await this.store.createLoan(loan)
    await this.emit('loan_approved', {
      loanId: storedLoan.id,
      borrowerAgentId: storedLoan.borrowerAgentId,
      borrowerName: borrower.name,
      lenderAgentId: storedLoan.lenderAgentId,
      lenderName: lenderMatch.lender.name,
      amount: storedLoan.principal,
      chainKey: storedLoan.chainKey
    })
    return storedLoan
  }

  async disburseLoan(loanId: string): Promise<Loan> {
    const loan = await this.store.getLoan(loanId)
    if (!loan) {
      throw new Error('Loan not found')
    }
    const lender = await this.store.getAgent(loan.lenderAgentId)
    const borrower = await this.store.getAgent(loan.borrowerAgentId)
    if (!lender || !borrower) {
      throw new Error('Loan agents not found')
    }

    const requestedWallet = borrower.wallets[loan.chainKey]
    const sourceChain = loan.lenderChainKey ?? loan.chainKey
    const lenderWallet = lender.wallets[sourceChain]
    if (!requestedWallet || !lenderWallet) {
      throw new Error('Required wallet is missing for disbursement')
    }

    const amountRaw = usdtNumberToRaw(loan.principal, loan.chainKey)
    let lenderTxHash: string | undefined
    let bridgeTxHash: string | undefined

    if (loan.isCrossChain) {
      const bridgeReceipt = await bridgeUsdtCrossChain({
        encryptedSeed: lender.encryptedSeed,
        chainKey: toWalletChain(sourceChain),
        targetChainKey: toWalletChain(loan.chainKey),
        recipient: requestedWallet.address,
        amountRaw
      })
      bridgeTxHash = bridgeReceipt.hash
      await this.emit('bridge_initiated', {
        loanId: loan.id,
        fromChainKey: sourceChain,
        toChainKey: loan.chainKey,
        amount: loan.principal,
        txHash: bridgeReceipt.hash
      })
    } else {
      const transferReceipt = await transferUsdt({
        encryptedSeed: lender.encryptedSeed,
        chainKey: toWalletChain(loan.chainKey),
        recipient: requestedWallet.address,
        amountRaw
      })
      lenderTxHash = transferReceipt.hash
    }

    await this.store.updateAgent(lender.id, { status: 'lending' })
    await this.store.updateAgent(borrower.id, { status: 'borrowing' })
    await refreshAgentBalances(this.store, lender)
    await refreshAgentBalances(this.store, borrower)

    const updatedLoan = await this.store.updateLoan(loan.id, {
      status: 'disbursed',
      lenderTxHash,
      bridgeTxHash,
      disbursedAt: new Date()
    })

    if (!updatedLoan) {
      throw new Error('Failed to persist disbursed loan')
    }

    await this.emit('loan_disbursed', {
      loanId: updatedLoan.id,
      borrowerAgentId: borrower.id,
      borrowerName: borrower.name,
      amount: updatedLoan.principal,
      chainKey: updatedLoan.chainKey,
      lenderTxHash,
      bridgeTxHash,
      explorerUrl: explorerUrl(updatedLoan.chainKey, bridgeTxHash ?? lenderTxHash ?? '')
    })

    return updatedLoan
  }

  async triggerRepayment(loanId: string): Promise<Loan> {
    const loan = await this.store.getLoan(loanId)
    if (!loan) {
      throw new Error('Loan not found')
    }
    const lender = await this.store.getAgent(loan.lenderAgentId)
    const borrower = await this.store.getAgent(loan.borrowerAgentId)
    if (!lender || !borrower) {
      throw new Error('Loan agents not found')
    }

    const repaymentChain = loan.chainKey
    const lenderWallet = lender.wallets[repaymentChain]
    if (!lenderWallet) {
      throw new Error('Lender wallet missing for repayment')
    }

    const receipt = await transferUsdt({
      encryptedSeed: borrower.encryptedSeed,
      chainKey: toWalletChain(repaymentChain),
      recipient: lenderWallet.address,
      amountRaw: usdtNumberToRaw(loan.totalRepayment, repaymentChain)
    })

    const repaidLoan = await this.store.updateLoan(loan.id, {
      status: 'repaid',
      borrowerTxHash: receipt.hash,
      repaidAt: new Date()
    })
    if (!repaidLoan) {
      throw new Error('Failed to persist repaid loan')
    }

    await this.store.updateAgent(lender.id, { status: 'idle' })
    await this.store.updateAgent(borrower.id, { status: 'idle' })
    await refreshAgentBalances(this.store, lender)
    await refreshAgentBalances(this.store, borrower)

    const existingHistory = (await this.store.getCreditHistory(borrower.id)) ?? defaultCreditHistory(borrower.id)
    const daysToRepay = Math.max(1, Math.round((Date.now() - loan.createdAt.getTime()) / (24 * 60 * 60 * 1000)))
    const updatedHistory: CreditHistory = updateCreditHistory(existingHistory, 'repaid', loan.principal, daysToRepay)
    await this.store.upsertCreditHistory(updatedHistory)
    await this.store.updateAgent(borrower.id, { creditScore: updatedHistory.score })

    await this.emit('loan_repaid', {
      loanId: repaidLoan.id,
      borrowerAgentId: borrower.id,
      borrowerName: borrower.name,
      amount: repaidLoan.totalRepayment,
      chainKey: repaidLoan.chainKey,
      borrowerTxHash: repaidLoan.borrowerTxHash,
      totalRepayment: repaidLoan.totalRepayment
    })
    return repaidLoan
  }

  async runFullLendingCycle(input: LendingCycleInput): Promise<Loan> {
    const requestedLoan = await this.createRequestedLoan(input)
    if (requestedLoan.status === 'rejected') {
      return requestedLoan
    }

    const disbursed = await this.disburseLoan(requestedLoan.id)
    await this.store.updateLoan(disbursed.id, { status: 'executing' })
    await new Promise((resolve) => setTimeout(resolve, 3000))
    await this.store.updateLoan(disbursed.id, { status: 'repaying' })
    return this.triggerRepayment(disbursed.id)
  }

  async evaluateOverdueLoans(): Promise<Loan[]> {
    const now = new Date()
    const loans = await this.store.listLoans()
    const overdueLoans = loans.filter((loan) => activeLoanStatus(loan.status) && loan.dueAt.getTime() < now.getTime())
    const updated: Loan[] = []

    for (const loan of overdueLoans) {
      const borrower = await this.store.getAgent(loan.borrowerAgentId)
      if (!borrower) {
        continue
      }

      const history = (await this.store.getCreditHistory(borrower.id)) ?? defaultCreditHistory(borrower.id)
      const nextHistory = updateCreditHistory(history, 'defaulted', loan.principal, 30)
      await this.store.upsertCreditHistory(nextHistory)
      await this.store.updateAgent(borrower.id, { creditScore: nextHistory.score, status: 'paused' })
      if (loan.lenderAgentId) {
        await this.store.updateAgent(loan.lenderAgentId, { status: 'idle' })
      }

      const defaultedLoan = await this.store.updateLoan(loan.id, { status: 'defaulted' })
      if (defaultedLoan) {
        updated.push(defaultedLoan)
      }

      await this.createAlert({
        id: createId('alert'),
        type: 'loan_default_risk',
        severity: 'critical',
        agentId: borrower.id,
        message: `Loan ${loan.id} has defaulted`,
        metadata: { loanId: loan.id, chainKey: loan.chainKey },
        dismissed: false,
        createdAt: now
      })
    }

    return updated
  }

  async executeSkill(agentId: string, skillId: string, chainKey: ChainKey, input: Record<string, unknown>): Promise<SkillExecution> {
    const agent = await this.store.getAgent(agentId)
    if (!agent) {
      throw new Error('Agent not found')
    }
    const skill = getSkillById(skillId)
    if (!skill) {
      throw new Error('Skill not found')
    }
    if (!skill.supportedChains.includes(chainKey)) {
      throw new Error('Skill is not supported on this chain')
    }

    const execution: SkillExecution = {
      executionId: createId('exec'),
      skillId: skill.skillId,
      agentId,
      chainKey,
      status: 'running',
      input,
      startedAt: new Date()
    }
    await this.store.createSkillExecution(execution)

    let output: Record<string, unknown> = {
      summary: `${skill.name} completed successfully`,
      estimatedDurationSecs: skill.estimatedDurationSecs
    }
    let txHash: string | undefined

    if (skill.skillId === 'bridge-usdt') {
      const targetChainKey = (typeof input.targetChainKey === 'string' ? input.targetChainKey : 'ARBITRUM') as ChainKey
      const amountRaw = usdtNumberToRaw(Number(input.amount ?? 1), chainKey)
      const recipient = agent.wallets[targetChainKey]?.address ?? agent.wallets[chainKey]?.address
      if (!recipient) {
        throw new Error('Recipient wallet is missing for bridge skill')
      }
      const receipt = await bridgeUsdtCrossChain({
        encryptedSeed: agent.encryptedSeed,
        chainKey: toWalletChain(chainKey),
        targetChainKey: toWalletChain(targetChainKey),
        recipient,
        amountRaw
      })
      txHash = receipt.hash
      output = { ...output, receipt }
    } else {
      txHash = createId('skilltx')
      output = {
        ...output,
        supportedChains: skill.supportedChains,
        txHash,
        availableSkills: SKILLS.length
      }
    }

    const completedExecution = await this.store.updateSkillExecution(execution.executionId, {
      status: 'success',
      output,
      txHash,
      completedAt: new Date()
    })

    if (!completedExecution) {
      throw new Error('Failed to persist skill execution')
    }

    await this.emit('skill_executed', {
      executionId: completedExecution.executionId,
      agentId: completedExecution.agentId,
      borrowerAgentId: completedExecution.agentId,
      borrowerName: agent.name,
      skillId: completedExecution.skillId,
      skillName: skill.name,
      status: completedExecution.status
    })
    return completedExecution
  }
}

export function createOrchestrator(store: ArbiterStore, ws: WebSocketHub): OrchestratorService {
  return new OrchestratorService(store, ws)
}
