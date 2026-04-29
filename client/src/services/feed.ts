// src/services/feed.ts
//
// Defines how a user's home feed is constructed on the client.
// The default policy is:
// - Start from the viewer
// - Perform a BFS over the social graph (followers / following)
// - Pool all posts from visited accounts
// - Order them primarily by graph distance (closer first), then by recency
//
// A later transformer (e.g. transformer.js) can re-rank the pooled posts.

import type { Post } from '../types/posts'

/** Adjacency information for a single user in the social graph. */
export interface UserNeighbors {
  /** Accounts this user follows. */
  following?: string[]
  /** Accounts that follow this user. */
  followers?: string[]
}

/** In-memory representation of the social graph keyed by username/handle. */
export type UserGraph = Record<string, UserNeighbors>

/** Index of posts keyed by author username/handle. */
export type PostsByUser = Record<string, Post[]>

/** Options controlling how the BFS-based feed is built. */
export interface FeedBfsOptions {
  /**
   * Maximum graph distance (in hops) from the viewer to traverse.
   * 0 = only the viewer's own posts, 1 = viewer + direct neighbors, etc.
   * Default: 2
   */
  maxDepth?: number

  /**
   * Hard cap on the number of posts to return.
   * Default: no hard cap (Infinity).
   */
  maxPosts?: number

  /**
   * Whether to include the viewer's own posts in the feed pool.
   * Default: true.
   */
  includeSelf?: boolean

  /**
   * Direction of edges to follow during BFS.
   * - 'following': traverse only "I follow them" edges (typical home timeline)
   * - 'followers': traverse only "they follow me" edges
   * - 'both': traverse both directions
   * Default: 'following'.
   */
  edgeDirection?: 'following' | 'followers' | 'both'
}

/** Enriched feed item with metadata about how "far" it is from the viewer. */
export interface FeedItem extends Post {
  /**
   * Graph distance in hops from the viewer to this post's author.
   * 0 = viewer themselves, 1 = direct neighbor, etc.
   */
  distance: number
}

/**
 * Build a home feed for a viewer using a BFS over the social graph.
 *
 * This function is intentionally pure and synchronous so that:
 * - the calling code can decide how to fetch/populate `graph` and `postsByUser`
 * - a later ranking layer (e.g. transformer.js) can re-order the returned items
 */
export function buildBfsFeedForUser(
  viewerUsername: string,
  graph: UserGraph,
  postsByUser: PostsByUser,
  options: FeedBfsOptions = {}
): FeedItem[] {
  const {
    maxDepth = 2,
    maxPosts = Number.POSITIVE_INFINITY,
    includeSelf = true,
    edgeDirection = 'following',
  } = options

  if (!viewerUsername) {
    return []
  }

  const visited = new Set<string>()
  const seenPostGuids = new Set<string>()
  const queue: Array<{ username: string; distance: number }> = []

  // Initialize BFS starting point(s)
  if (includeSelf) {
    visited.add(viewerUsername)
    queue.push({ username: viewerUsername, distance: 0 })
  } else {
    const neighbors = getNeighborsForTraversal(viewerUsername, graph, edgeDirection)
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor)
        queue.push({ username: neighbor, distance: 1 })
      }
    }
  }

  const result: FeedItem[] = []

  // Standard BFS over the social graph
  while (queue.length > 0 && result.length < maxPosts) {
    const current = queue.shift()
    if (!current) {
      break
    }

    const { username, distance } = current

    // Collect posts for this user, if any, and annotate with distance
    const userPosts = postsByUser[username] ?? []
    for (const post of userPosts) {
      if (result.length >= maxPosts) {
        break
      }
      if (post.guid && seenPostGuids.has(post.guid)) {
        continue
      }
      if (post.guid) {
        seenPostGuids.add(post.guid)
      }
      result.push({
        ...post,
        distance,
      })
    }

    // Stop expanding neighbors once we hit maxDepth
    if (distance >= maxDepth) {
      continue
    }

    const neighbors = getNeighborsForTraversal(username, graph, edgeDirection)
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor)
        queue.push({ username: neighbor, distance: distance + 1 })
      }
    }
  }

  // Default ordering policy for the feed *before* any ML/transformer ranking:
  // 1. Closer graph distance first (0, then 1, then 2, ...)
  // 2. Within the same distance, show most recent posts first.
  result.sort((a, b) => {
    if (a.distance !== b.distance) {
      return a.distance - b.distance
    }

    const aTime = a.created_at
    const bTime = b.created_at
    if (!aTime && !bTime) return 0
    if (!aTime) return 1
    if (!bTime) return -1

    // Newer first
    if (aTime === bTime) return 0
    return aTime < bTime ? 1 : -1
  })

  // Enforce maxPosts again after sorting, in case the sorter changes relative order
  return result.slice(0, maxPosts)
}

/**
 * Helper to get neighbors for BFS based on the configured edge direction.
 */
function getNeighborsForTraversal(
  username: string,
  graph: UserGraph,
  edgeDirection: FeedBfsOptions['edgeDirection']
): string[] {
  const node = graph[username]
  if (!node) {
    return []
  }

  const following = node.following ?? []
  const followers = node.followers ?? []

  if (edgeDirection === 'following') {
    return following
  }
  if (edgeDirection === 'followers') {
    return followers
  }

  // 'both' – merge and deduplicate
  if (following.length === 0) {
    return followers
  }
  if (followers.length === 0) {
    return following
  }

  const merged = new Set<string>()
  for (const u of following) merged.add(u)
  for (const u of followers) merged.add(u)
  return Array.from(merged)
}

