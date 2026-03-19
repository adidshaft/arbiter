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
    onMutate: () => ({ toastId: toast.loading('Provisioning agent wallets...') }),
    onSuccess: async (_result, _variables, context) => {
      toast.dismiss(context?.toastId)
      toast.success('Agent created')
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['agents'] }),
        queryClient.refetchQueries({ queryKey: ['balances'] }),
        queryClient.refetchQueries({ queryKey: ['events'] })
      ])
    },
    onError: (error, _variables, context) => {
      toast.dismiss(context?.toastId)
      toast.error(getApiErrorMessage(error))
    }
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: SerializedAgent['status'] }) =>
      apiPatch<SerializedAgent>(`/api/agents/${id}/status`, { status }),
    onMutate: ({ status }) => ({ toastId: toast.loading(`Setting agent to ${status}...`) }),
    onSuccess: async (_, variables, context) => {
      toast.dismiss(context?.toastId)
      toast.success(`Agent set to ${variables.status}`)
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['agents'] }),
        queryClient.refetchQueries({ queryKey: ['agent', variables.id] }),
        queryClient.refetchQueries({ queryKey: ['balances'] }),
        queryClient.refetchQueries({ queryKey: ['balances', variables.id] }),
        queryClient.refetchQueries({ queryKey: ['events'] })
      ])
    },
    onError: (error, _variables, context) => {
      toast.dismiss(context?.toastId)
      toast.error(getApiErrorMessage(error))
    }
  })

  const updateConfig = useMutation({
    mutationFn: ({ id, config }: { id: string; config: SerializedAgent['config'] }) =>
      apiPatch<SerializedAgent>(`/api/agents/${id}/config`, config),
    onMutate: () => ({ toastId: toast.loading('Saving configuration...') }),
    onSuccess: async (_, variables, context) => {
      toast.dismiss(context?.toastId)
      toast.success('Configuration saved')
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['agents'] }),
        queryClient.refetchQueries({ queryKey: ['agent', variables.id] }),
        queryClient.refetchQueries({ queryKey: ['events'] })
      ])
    },
    onError: (error, _variables, context) => {
      toast.dismiss(context?.toastId)
      toast.error(getApiErrorMessage(error))
    }
  })

  const refreshBalances = useMutation({
    mutationFn: (agentId: string) => apiPost(`/api/agents/${agentId}/refresh-balances`),
    onMutate: () => ({ toastId: toast.loading('Refreshing balances across chains...') }),
    onSuccess: async (_, agentId, context) => {
      toast.dismiss(context?.toastId)
      toast.success('Balances refreshed')
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['balances'] }),
        queryClient.refetchQueries({ queryKey: ['balances', agentId] }),
        queryClient.refetchQueries({ queryKey: ['agents'] }),
        queryClient.refetchQueries({ queryKey: ['events'] })
      ])
    },
    onError: (error, _variables, context) => {
      toast.dismiss(context?.toastId)
      toast.error(getApiErrorMessage(error))
    }
  })

  const pauseAll = useMutation({
    mutationFn: () => apiPost<SerializedAgent[]>('/api/agents/pause-all'),
    onMutate: () => ({ toastId: toast.loading('Engaging kill switch...') }),
    onSuccess: async (_result, _variables, context) => {
      toast.dismiss(context?.toastId)
      toast.success('Kill switch engaged')
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['agents'] }),
        queryClient.refetchQueries({ queryKey: ['balances'] }),
        queryClient.refetchQueries({ queryKey: ['events'] }),
        queryClient.refetchQueries({ queryKey: ['credit'] })
      ])
    },
    onError: (error, _variables, context) => {
      toast.dismiss(context?.toastId)
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
