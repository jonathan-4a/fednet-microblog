// src/services/mastodonProfile.ts
// Mastodon API for profile counts when ActivityPub actor is incomplete or collections 401
import { fetchResource } from './proxy'
import { isRemoteUrl } from './proxy'

interface MastodonAccount {
  id: string
  username: string
  display_name?: string
  acct: string
  url?: string
  followers_count?: number
  following_count?: number
  statuses_count?: number
  note?: string
}

/** Extract origin and acct from actor URL */
function actorUrlToAcct(actorUrl: string): { origin: string; acct: string } | null {
  try {
    const url = new URL(actorUrl)
    const origin = `${url.protocol}//${url.host}`
    const parts = url.pathname.split('/').filter(Boolean)
    const usersIdx = parts.indexOf('users')
    if (usersIdx !== -1 && usersIdx < parts.length - 1) {
      const username = parts[usersIdx + 1]
      const acct = `${username}@${url.hostname}`
      return { origin, acct }
    }
    const uIdx = parts.indexOf('u')
    if (uIdx !== -1 && uIdx < parts.length - 1) {
      const username = parts[uIdx + 1]
      const acct = `${username}@${url.hostname}`
      return { origin, acct }
    }
    return null
  } catch {
    return null
  }
}

/** Fetch Mastodon account for counts (followers, following, statuses). Use when ActivityPub actor lacks this data. */
export async function getMastodonAccountByActorUrl(
  actorUrl: string
): Promise<{ followers_count: number; following_count: number; statuses_count: number } | null> {
  const parsed = actorUrlToAcct(actorUrl)
  if (!parsed || !isRemoteUrl(actorUrl)) return null

  try {
    const account = await fetchResource<MastodonAccount>(
      `${parsed.origin}/api/v1/accounts/lookup?acct=${encodeURIComponent(parsed.acct)}`,
      { acceptHeader: 'application/json' }
    )
    if (!account?.id) return null
    return {
      followers_count: account.followers_count ?? 0,
      following_count: account.following_count ?? 0,
      statuses_count: account.statuses_count ?? 0,
    }
  } catch {
    return null
  }
}
