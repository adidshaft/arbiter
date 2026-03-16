import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import type { SerializedAgent } from '../lib/types'
import { apiFetch, apiPatch, apiPost, getApiErrorMessage } from '../lib/api'

export function useAgents() {
  const queryClient = useQueryClient()

  const agentsQuery = useQuery({
    queryKey: ['agents'],
    queryFn: () => apiFetch<SerializedAgent[]>('/api/agents')
  })

  const createAgent = useMutation({
    mutationFn: (payload: { name: string; role: SerializedAgent['role'] }) =>
      apiPost<SerializedAgent>('/api/agents', payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['agents'] })
      void queryClient.invalidateQueries({ queryKey: ['balances'] })
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    }
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: SerializedAgent['status'] }) =>
      apiPatch<SerializedAgent>(`/api/agents/${id}/status`, { status }),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['agents'] })
      void queryClient.invalidateQueries({ queryKey: ['agent', variables.id] })
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    }
  })

  const updateConfig = useMutation({
    mutationFn: ({ id, config }: { id: string; config: SerializedAgent['config'] }) =>
      apiPatch<SerializedAgent>(`/api/agents/${id}/config`, config),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['agents'] })
      void queryClient.invalidateQueries({ queryKey: ['agent', variables.id] })
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    }
  })

  const refreshBalances = useMutation({
    mutationFn: (agentId: string) => apiPost(`/api/agents/${agentId}/refresh-balances`),
    onSuccess: (_, agentId) => {
      void queryClient.invalidateQueries({ queryKey: ['balances'] })
      void queryClient.invalidateQueries({ queryKey: ['balances', agentId] })
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    }
  })

  const pauseAll = useMutation({
    mutationFn: () => apiPost<SerializedAgent[]>('/api/agents/pause-all'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['agents'] })
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    }
  })

  return {
    ...agentsQuery,
    createAgent,
    updateStatus,
    updateConfig,
    refreshBalances,
    pauseAll
  }
}

