import { useQuery } from '@tanstack/react-query'
import type { SerializedAgentBalance } from '../lib/types'
import { apiFetch } from '../lib/api'

export function useAgentBalances(agentId?: string) {
  return useQuery({
    queryKey: agentId ? ['balances', agentId] : ['balances'],
    queryFn: () =>
      apiFetch<SerializedAgentBalance[]>(agentId ? `/api/balances/${agentId}` : '/api/balances')
  })
}

