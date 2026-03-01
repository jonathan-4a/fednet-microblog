// src/services/config.ts
import { apiRequest } from './apiClient'

export interface ServerConfig {
  registration_mode: 'open' | 'invite'
}

export async function getServerConfig(): Promise<ServerConfig> {
  return (await apiRequest('/api/config', {})) as ServerConfig
}

