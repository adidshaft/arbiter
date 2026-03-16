import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import type { SerializedContractTrustRecord } from '../lib/types'
import { apiDelete, apiFetch, apiPost, getApiErrorMessage } from '../lib/api'

export function useTrust() {
  const queryClient = useQueryClient()
  const records = useQuery({
    queryKey: ['trust'],
    queryFn: () => apiFetch<SerializedContractTrustRecord[]>('/api/trust/registry')
  })

  const scoreContract = useMutation({
    mutationFn: (payload: { contractAddress: string; chainKey: SerializedContractTrustRecord['chainKey'] }) =>
      apiPost<SerializedContractTrustRecord>('/api/trust/score', payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['trust'] })
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    }
  })

  const deleteContract = useMutation({
    mutationFn: (contractAddress: string) => apiDelete(`/api/trust/${contractAddress}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['trust'] })
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    }
  })

  return { records, scoreContract, deleteContract }
}

