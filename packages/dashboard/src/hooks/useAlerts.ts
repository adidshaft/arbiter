import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import type { SerializedAlert } from '../lib/types'
import { apiFetch, apiPost, getApiErrorMessage } from '../lib/api'

export function useAlerts() {
  const queryClient = useQueryClient()

  const alerts = useQuery({
    queryKey: ['alerts'],
    queryFn: () => apiFetch<SerializedAlert[]>('/api/alerts')
  })

  const dismissAlert = useMutation({
    mutationFn: (id: string) => apiPost<SerializedAlert>(`/api/alerts/${id}/dismiss`, {}),
    onMutate: async (id) => {
      queryClient.setQueryData<SerializedAlert[]>(['alerts'], (previous) =>
        (previous ?? []).map((alert) => (alert.id === id ? { ...alert, dismissed: true } : alert))
      )
    },
    onSuccess: () => {
      void queryClient.refetchQueries({ queryKey: ['alerts'] })
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    }
  })

  return { alerts, dismissAlert }
}
