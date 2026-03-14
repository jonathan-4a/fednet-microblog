import type { Post } from '../../types/posts'
import { fetchResource, fetchResourceWithHeaders, parseLinkNext, isRemoteUrl } from '../proxy'

interface RemoteAccount {
  id: string
  username: string
  display_name?: string
  acct: string
  url?: string
  statuses_count?: number
  fqn?: string
}

interface RemoteStatus {
  id: string
  uri?: string
  url?: string
  content?: string
  created_at: string
  in_reply_to_id?: string | null
  reblog?: RemoteStatus | null
  account: RemoteAccount
  favourites_count?: number
  favorites_count?: number
  reblogs_count?: number
  replies_count?: number
}

function parseOutboxUrl(outboxUrl: string): { origin: string; username: string } | null {
  try {
    const url = new URL(outboxUrl)
    const parts = url.pathname.split('/').filter(Boolean)
    const usersIdx = parts.indexOf('users')
    if (usersIdx === -1 || usersIdx >= parts.length - 1) return null
    const username = parts[usersIdx + 1]
    const origin = `${url.protocol}//${url.host}`
    return { origin, username }
  } catch {
    return null
  }
}

function compatibleStatusToPost(
  status: RemoteStatus,
  authorUsername: string,
  likedPostIds: Set<string>
): Post {
  const noteId = status.uri || status.url || status.id
  const statusToUse = status.reblog || status
  const acc = statusToUse.account
  const likesCount = statusToUse.favourites_count ?? statusToUse.favorites_count ?? 0
  const repliesCount = statusToUse.replies_count ?? 0
  const sharesCount = statusToUse.reblogs_count ?? 0
  const post: Post = {
    guid: status.id,
    author_username: authorUsername,
    author_name: acc.display_name || acc.username,
    content: statusToUse.content ?? '',
    created_at: new Date(statusToUse.created_at).toISOString(),
    raw_message: status as object,
    likesCount,
    repliesCount,
    sharesCount,
    isLiked: likedPostIds.has(noteId),
    noteId,
    isRemote: true,
    inReplyTo: status.in_reply_to_id ?? null,
  }
  if (status.reblog) {
    post.isRepost = true
    post.repostedBy = status.account.url ?? ''
    const origAcc = statusToUse.account
    try {
      const url = origAcc.url
      post.author_username = url ? `${origAcc.username}@${new URL(url).hostname}` : (origAcc.acct || `${origAcc.username}@unknown`)
    } catch {
      post.author_username = origAcc.acct || `${origAcc.username}@unknown`
    }
    post.author_name = origAcc.display_name || origAcc.username
  }
  return post
}

export async function getPostsViaCompatibleApi(
  outboxUrl: string,
  params: {
    limit?: number
    currentUsername?: string
    likedPostIds?: Set<string>
    repliesOnly?: boolean
  }
): Promise<{ posts: Post[]; replies: Post[]; totalItems?: number; next?: string | null }> {
  const parsed = parseOutboxUrl(outboxUrl)
  if (!parsed) throw new Error('Invalid outbox URL for compatible API fallback')

  const { origin, username } = parsed
  let hostname: string
  try {
    hostname = new URL(outboxUrl).hostname
  } catch {
    hostname = new URL(origin).hostname
  }
  const acct = username.includes('@') ? username : `${username}@${hostname}`

  const likedPostIds = params.likedPostIds ?? new Set<string>()

  const lookupUrl = `${origin}/api/v1/accounts/lookup?acct=${encodeURIComponent(acct)}`
  const account = await fetchResource<RemoteAccount>(lookupUrl, {
    acceptHeader: 'application/json',
  })
  if (!account?.id) throw new Error('Account not found')

  const limit = params.limit ?? 20
  const statusesUrl = `${origin}/api/v1/accounts/${account.id}/statuses?limit=${limit}&exclude_reblogs=true${params.repliesOnly ? '&exclude_replies=false' : '&exclude_replies=true'}`
  const { data: statuses, headers } = await fetchResourceWithHeaders<RemoteStatus[]>(statusesUrl, {
    acceptHeader: 'application/json',
  })
  const nextUrl = parseLinkNext(headers.get('Link'))

  if (!Array.isArray(statuses)) return { posts: [], replies: [] }

  const authorHandle = account.fqn ?? (account.acct?.includes('@') ? account.acct : `${account.username}@${hostname}`)
  const posts: Post[] = []
  const replies: Post[] = []

  for (const status of statuses) {
    const post = compatibleStatusToPost(status, authorHandle, likedPostIds)
    if (params.repliesOnly) {
      if (status.in_reply_to_id) replies.push(post)
    } else {
      if (status.in_reply_to_id) {
        replies.push(post)
      } else {
        posts.push(post)
      }
    }
  }

  return {
    posts,
    replies,
    totalItems: account.statuses_count,
    next: nextUrl,
  }
}

function getAccountIdFromStatusesUrl(statusesUrl: string): string | null {
  try {
    const m = statusesUrl.match(/\/api\/v1\/accounts\/([^/]+)\/statuses/)
    return m ? m[1] : null
  } catch {
    return null
  }
}

export async function getPostsViaCompatibleApiPage(
  statusesUrl: string,
  params: {
    currentUsername?: string
    likedPostIds?: Set<string>
  }
): Promise<{ posts: Post[]; replies: Post[]; totalItems?: number; next?: string | null }> {
  const likedPostIds = params.likedPostIds ?? new Set<string>()

  const accountId = getAccountIdFromStatusesUrl(statusesUrl)
  if (!accountId) throw new Error('Invalid statuses URL')

  const url = new URL(statusesUrl)
  const origin = `${url.protocol}//${url.host}`
  const account = await fetchResource<RemoteAccount>(
    `${origin}/api/v1/accounts/${accountId}`,
    { acceptHeader: 'application/json' }
  )
  if (!account?.id) throw new Error('Account not found')

  const hostname = url.hostname

  const { data: statuses, headers } = await fetchResourceWithHeaders<RemoteStatus[]>(statusesUrl, {
    acceptHeader: 'application/json',
  })
  const nextUrl = parseLinkNext(headers.get('Link'))
  if (!Array.isArray(statuses)) return { posts: [], replies: [], next: nextUrl }

  const authorHandle = account.fqn ?? (account.acct?.includes('@') ? account.acct : `${account.username}@${hostname}`)
  const posts: Post[] = []
  const replies: Post[] = []
  for (const status of statuses) {
    const post = compatibleStatusToPost(status, authorHandle, likedPostIds)
    if (status.in_reply_to_id) replies.push(post)
    else posts.push(post)
  }
  return { posts, replies, totalItems: account.statuses_count, next: nextUrl }
}

export function isCompatibleStatusesUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.pathname.includes('/api/v1/accounts/') && u.pathname.includes('/statuses')
  } catch {
    return false
  }
}

export function isCompatibleOutbox(url: string): boolean {
  try {
    const parsed = parseOutboxUrl(url)
    return parsed !== null && isRemoteUrl(url)
  } catch {
    return false
  }
}
