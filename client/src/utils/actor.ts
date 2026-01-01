import { API_BASE } from '../config'

export function parseActorUrl(actorUrl: string): {
  username: string
  handle: string
  isLocal: boolean
} {
  try {
    const url = new URL(actorUrl)
    const parts = url.pathname.split('/').filter(Boolean)
    const usernamePart = parts[parts.length - 1]
    const handle = `${usernamePart}@${url.host}`

    const apiBaseUrl = new URL(API_BASE)
    const apiHostname = apiBaseUrl.hostname
    const apiPort = apiBaseUrl.port
    const actorHostname = url.hostname
    const actorPort = url.port

    const isLocal =
      actorHostname === apiHostname && actorPort === apiPort

    return { username: usernamePart, handle, isLocal }
  } catch {
    return { username: actorUrl, handle: actorUrl, isLocal: false }
  }
}

