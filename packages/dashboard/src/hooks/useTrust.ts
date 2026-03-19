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
    onMutate: () => ({ toastId: toast.loading('Scoring contract with AI and heuristics...') }),
    onSuccess: async (_result, _variables, context) => {
      toast.dismiss(context?.toastId)
      toast.success('Contract scored')
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['trust'] }),
        queryClient.refetchQueries({ queryKey: ['events'] }),
        queryClient.refetchQueries({ queryKey: ['alerts'] })
      ])
    },
    onError: (error, _variables, context) => {
      toast.dismiss(context?.toastId)
      toast.error(getApiErrorMessage(error))
    }
  })

  const deleteContract = useMutation({
    mutationFn: (contractAddress: string) => apiDelete(`/api/trust/${contractAddress}`),
    onSuccess: async () => {
      toast.success('Trust record removed')
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['trust'] }),
        queryClient.refetchQueries({ queryKey: ['events'] })
      ])
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    }
  })

  return { records, scoreContract, deleteContract }
}
