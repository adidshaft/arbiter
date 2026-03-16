import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import type { SerializedCreditHistory, SerializedLendingPool, SerializedLoan } from '../lib/types'
import { apiFetch, apiPost, getApiErrorMessage } from '../lib/api'

export function useLending(agentIds: string[] = []) {
  const queryClient = useQueryClient()
  const loans = useQuery({
    queryKey: ['loans'],
    queryFn: () => apiFetch<SerializedLoan[]>('/api/loans')
  })

  const pool = useQuery({
    queryKey: ['pool'],
    queryFn: () => apiFetch<SerializedLendingPool>('/api/pool')
  })

  const credits = useQueries({
    queries: agentIds.map((agentId) => ({
      queryKey: ['credit', agentId],
      queryFn: () => apiFetch<SerializedCreditHistory>(`/api/credit/${agentId}`)
    }))
  })

  const requestLoan = useMutation({
    mutationFn: (payload: {
      borrowerAgentId: string
      amount: number
      chainKey: SerializedLoan['chainKey']
      targetContract: string
      taskDescription: string
    }) => apiPost<SerializedLoan>('/api/request', payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['loans'] })
      void queryClient.invalidateQueries({ queryKey: ['pool'] })
      void queryClient.invalidateQueries({ queryKey: ['agents'] })
      void queryClient.invalidateQueries({ queryKey: ['balances'] })
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    }
  })

  const simulate = useMutation({
    mutationFn: (payload: { principal: number; trustScore: string; agentId?: string }) =>
      apiPost<{ terms: unknown; pool: SerializedLendingPool }>('/api/simulate', payload),
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    }
  })

  const repay = useMutation({
    mutationFn: (loanId: string) => apiPost<SerializedLoan>(`/api/${loanId}/repay`, {}),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['loans'] })
      void queryClient.invalidateQueries({ queryKey: ['pool'] })
      void queryClient.invalidateQueries({ queryKey: ['agents'] })
      void queryClient.invalidateQueries({ queryKey: ['balances'] })
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    }
  })

  return { loans, pool, credits, requestLoan, simulate, repay }
}

