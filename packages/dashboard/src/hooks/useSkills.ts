import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import type { SerializedAgentSkill, SerializedSkillExecution } from '../lib/types'
import { apiFetch, apiPost, getApiErrorMessage } from '../lib/api'

export function useSkills() {
  const queryClient = useQueryClient()

  const skills = useQuery({
    queryKey: ['skills'],
    queryFn: () => apiFetch<SerializedAgentSkill[]>('/api/skills')
  })

  const executions = useQuery({
    queryKey: ['skillExecutions'],
    queryFn: () => apiFetch<SerializedSkillExecution[]>('/api/skills/executions')
  })

  const executeSkill = useMutation({
    mutationFn: (payload: {
      skillId: string
      agentId: string
      chainKey: SerializedSkillExecution['chainKey']
      input: Record<string, unknown>
    }) => apiPost<SerializedSkillExecution>('/api/skills/execute', payload),
    onMutate: () => ({ toastId: toast.loading('Executing skill on live agent...') }),
    onSuccess: async (_result, _variables, context) => {
      toast.dismiss(context?.toastId)
      toast.success('Skill execution recorded')
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['skillExecutions'] }),
        queryClient.refetchQueries({ queryKey: ['balances'] }),
        queryClient.refetchQueries({ queryKey: ['events'] })
      ])
    },
    onError: (error, _variables, context) => {
      toast.dismiss(context?.toastId)
      toast.error(getApiErrorMessage(error))
    }
  })

  return { skills, executions, executeSkill }
}
