// src/services/feedService.ts
//
// High-level feed service that:
// - Crawls the social graph (followers / following) with BFS up to a max depth
// - Fetches posts for discovered users
// - Delegates to the core feed module to build a ranked feed
//
// This keeps HomePage and other UI components simple; they call a single
// function (or hook) instead of manually wiring graph + posts fetching.

import { API_BASE } from '../config'
import { getFollowers, getFollowing } from './socials'
import { getUserPosts } from './posts'
import { extractUsernameFromActorUrl, processInBatches, fetchResource } from './posts/utils'
import type { Actor } from '../types/activitypub'
import {
  buildBfsFeedForUser,
  type UserGraph,
  type PostsByUser,
  type FeedItem,
  type FeedBfsOptions,
} from './feed'
import { buildUserActivityProfile, rerankFeedItems } from './feedRanking'

interface GraphBfsOptions {
  /** Maximum graph depth (in hops) to traverse from the viewer. */
  maxDepth?: number
  /** Hard cap on how many distinct users we will traverse. */
  maxUsers?: number
}

export interface HomeFeedLoadOptions extends FeedBfsOptions, GraphBfsOptions {
  /** Maximum number of posts to fetch per user when building the pool. */
  postsPerUserLimit?: number
}

export interface HomeFeedData {
  feed: FeedItem[]
  graph: UserGraph
  postsByUser: PostsByUser
}

interface ActorIndexEntry {
  actorUrl: string
  isLocal: boolean
  followersUrl?: string
  followingUrl?: string
}

/**
 * Compute a stable feed key for an actor URL.
 * - Local actors: use bare username as key (e.g. "alice")
 * - Remote actors: use handle username@host (e.g. "alice@example.com")
 */
function getFeedKeyForActorUrl(actorUrl: string): { key: string; isLocal: boolean } {
  const username = extractUsernameFromActorUrl(actorUrl) || actorUrl
  try {
    const url = new URL(actorUrl)
    const isLocal = url.origin === API_BASE
    if (isLocal) {
      return { key: username, isLocal: true }
    }
    return { key: `${username}@${url.hostname}`, isLocal: false }
  } catch {
    return { key: username, isLocal: false }
  }
}

/**
 * Extract feed keys from an OrderedCollection of followers/following.
 * Items can be URLs or ActivityPub actor objects.
 * Also populates actorIndex with actorUrl/isLocal metadata.
 */
function extractKeysFromCollection(
  collection: { orderedItems?: unknown[] | null } | null | undefined,
  actorIndex: Record<string, ActorIndexEntry>
): string[] {
  if (!collection || !Array.isArray(collection.orderedItems)) {
    return []
  }

  const keys: string[] = []

  for (const item of collection.orderedItems) {
    let actorUrl: string | null = null
    if (typeof item === 'string') {
      actorUrl = item
    } else if (item && typeof item === 'object' && 'id' in item) {
      const id = (item as { id?: unknown }).id
      if (typeof id === 'string') {
        actorUrl = id
      }
    }

    if (!actorUrl) continue
    const { key, isLocal } = getFeedKeyForActorUrl(actorUrl)
    actorIndex[key] = { actorUrl, isLocal }
    keys.push(key)
  }

  return keys
}

/**
 * Crawl the social graph (local + remote) starting from `viewerUsername` using BFS.
 * Returns the constructed UserGraph and the ordered list of visited usernames.
 */
async function buildGraphForUser(
  viewerUsername: string,
  options: GraphBfsOptions = {}
): Promise<{ graph: UserGraph; visitedOrder: string[]; actorIndex: Record<string, ActorIndexEntry> }> {
  const { maxDepth = 4, maxUsers = 50 } = options

  const graph: UserGraph = {}
  const visited = new Set<string>()
  const visitedOrder: string[] = []
  const actorIndex: Record<string, ActorIndexEntry> = {}

  // Seed viewer as a local actor
  const viewerActorUrl = `${API_BASE}/u/${encodeURIComponent(viewerUsername)}`
  actorIndex[viewerUsername] = {
    actorUrl: viewerActorUrl,
    isLocal: true,
    followersUrl: `${viewerActorUrl}/followers`,
    followingUrl: `${viewerActorUrl}/following`,
  }

  const queue: Array<{ key: string; depth: number }> = []
  visited.add(viewerUsername)
  visitedOrder.push(viewerUsername)
  queue.push({ key: viewerUsername, depth: 0 })

  while (queue.length > 0 && visited.size < maxUsers) {
    const current = queue.shift()
    if (!current) break

    const { key, depth } = current

    const idxEntry = actorIndex[key]
    if (!idxEntry) {
      continue
    }

    // Ensure we know this actor's followers/following URLs
    if (!idxEntry.followersUrl || !idxEntry.followingUrl) {
      try {
        const actor = await fetchResource<Actor>(idxEntry.actorUrl)
        if (actor) {
          idxEntry.followersUrl = actor.followers
          idxEntry.followingUrl = actor.following
        }
      } catch {
        // If we can't resolve actor document, we still try local-style URLs for locals
        if (!idxEntry.followersUrl || !idxEntry.followingUrl) {
          if (idxEntry.isLocal) {
            const base = `${API_BASE}/u/${encodeURIComponent(
              extractUsernameFromActorUrl(idxEntry.actorUrl) || key
            )}`
            idxEntry.followersUrl = idxEntry.followersUrl || `${base}/followers`
            idxEntry.followingUrl = idxEntry.followingUrl || `${base}/following`
          } else {
            // For remotes with no actor doc, we can't traverse further
            idxEntry.followersUrl = idxEntry.followersUrl || ''
            idxEntry.followingUrl = idxEntry.followingUrl || ''
          }
        }
      }
    }

    const [followersResult, followingResult] = await Promise.allSettled([
      idxEntry.followersUrl
        ? getFollowers(idxEntry.followersUrl)
        : Promise.resolve(null as unknown as never),
      idxEntry.followingUrl
        ? getFollowing(idxEntry.followingUrl)
        : Promise.resolve(null as unknown as never),
    ])

    const followersCollection =
      followersResult.status === 'fulfilled' ? followersResult.value : null
    const followingCollection =
      followingResult.status === 'fulfilled' ? followingResult.value : null

    const followers = extractKeysFromCollection(followersCollection, actorIndex)
    const following = extractKeysFromCollection(followingCollection, actorIndex)

    graph[key] = {
      followers,
      following,
    }

    // Enqueue neighbors if we haven't reached maxDepth
    if (depth >= maxDepth) {
      continue
    }

    const neighbors = new Set<string>([...followers, ...following])
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor) && visited.size < maxUsers) {
        visited.add(neighbor)
        visitedOrder.push(neighbor)
        queue.push({ key: neighbor, depth: depth + 1 })
      }
    }
  }

  return { graph, visitedOrder, actorIndex }
}

/**
 * Load a home feed for `viewerUsername` by:
 * - Crawling the graph up to the configured depth / user cap
 * - Fetching a limited number of posts for each discovered user
 * - Building a BFS-ordered feed via the core feed module
 */
export async function loadHomeFeedForUser(
  viewerUsername: string,
  options: HomeFeedLoadOptions = {}
): Promise<HomeFeedData> {
  const {
    maxDepth = 4,
    maxUsers = 50,
    postsPerUserLimit = 20,
    maxPosts,
    includeSelf,
    edgeDirection,
  } = options

  if (!viewerUsername) {
    return {
      feed: [],
      graph: {},
      postsByUser: {},
    }
  }

  // 1) Build the graph starting from the viewer
  const { graph, visitedOrder, actorIndex } = await buildGraphForUser(viewerUsername, {
    maxDepth,
    maxUsers,
  })

  // 2) Fetch posts for each discovered user (including the viewer)
  const postsByUser: PostsByUser = {}

  await processInBatches(
    visitedOrder,
    async (key) => {
      try {
        const idxEntry = actorIndex[key]
        // Local actor: use username-based API as before
        if (!idxEntry || idxEntry.isLocal) {
          const result = await getUserPosts(key, {
            limit: postsPerUserLimit,
            currentUsername: viewerUsername,
          })
          postsByUser[key] = result.posts
          return
        }

        // Remote actor: fetch Actor document to discover outbox and proper handle
        const actor = await fetchResource<Actor>(idxEntry.actorUrl)
        if (!actor || !actor.outbox) {
          return
        }

        let handle = actor.preferredUsername
        try {
          const url = new URL(actor.id)
          if (!handle.includes('@')) {
            handle = `${handle}@${url.hostname}`
          }
        } catch {
          // keep preferredUsername as-is
        }

        const result = await getUserPosts(handle, {
          limit: postsPerUserLimit,
          currentUsername: viewerUsername,
          outboxUrl: actor.outbox,
        })
        postsByUser[handle] = result.posts
      } catch {
        // If we can't load posts for a user, just skip them
      }
    },
    5
  )

  // 2b) Enrich posts with author_name for both local and remote authors
  const authorNameByKey: Record<string, string> = {}

  await processInBatches(
    Object.entries(actorIndex),
    async ([key, entry]) => {
      try {
        const actor = await fetchResource<Actor>(entry.actorUrl)
        if (actor && actor.name) {
          authorNameByKey[key] = actor.name
        }
      } catch {
        // Ignore failures; we'll fall back to username/handle
      }
    },
    5
  )

  // Apply author_name enrichment back onto posts (local and remote) by feed key
  for (const [key, posts] of Object.entries(postsByUser)) {
    const displayName = authorNameByKey[key]
    if (!displayName) continue
    postsByUser[key] = posts.map((post) =>
      post.author_name ? post : { ...post, author_name: displayName }
    )
  }

  // 3) Build the BFS-ordered feed from the graph + posts
  let feed = buildBfsFeedForUser(viewerUsername, graph, postsByUser, {
    maxDepth,
    maxPosts,
    includeSelf,
    edgeDirection,
  })

  // Fallback: if BFS produced no items but we do have posts for the viewer,
  // at least show their own posts ordered by recency (only when includeSelf is not explicitly disabled).
  if (feed.length === 0 && includeSelf !== false) {
    const selfPosts = postsByUser[viewerUsername] ?? []
    if (selfPosts.length > 0) {
      feed = [...selfPosts]
        .sort((a, b) => {
          const at = a.created_at
          const bt = b.created_at
          if (!at && !bt) return 0
          if (!at) return 1
          if (!bt) return -1
          return at < bt ? 1 : at > bt ? -1 : 0
        })
        .map((post) => ({
          ...post,
          distance: 0,
        }))
      if (typeof maxPosts === 'number') {
        feed = feed.slice(0, maxPosts)
      }
    }
  }

  // 4) AI ranking layer: re-order feed based on learned user preferences.
  //    This preserves all items but changes their order.
  const profile = buildUserActivityProfile(viewerUsername, postsByUser)
  const rankedFeed = await rerankFeedItems(feed, profile)

  return {
    feed: rankedFeed,
    graph,
    postsByUser,
  }
}

