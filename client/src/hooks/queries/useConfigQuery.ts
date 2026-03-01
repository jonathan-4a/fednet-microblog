// src/hooks/queries/useConfigQuery.ts
import { useQuery } from '@tanstack/react-query'
import { getServerConfig } from '../../services/config'
import type { ServerConfig } from '../../services/config'

function useServerConfigQuery() {
  return useQuery<ServerConfig, Error>({
    queryKey: ['serverConfig'],
    queryFn: getServerConfig,
    staleTime: 300000, // 5 minutes - config doesn't change often
  })
}

export function useServerConfig() {
  const { data: config, isLoading: loading, error } = useServerConfigQuery()
  return {
    config: config ?? null,
    loading,
    error: error?.message ?? null,
    isInviteOnly: config?.registration_mode === 'invite',
  }
}


