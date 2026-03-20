// src/services/feedRanking.ts
//
// Lightweight AI-ish ranking layer for the home feed.
// - Consumes the BFS-ordered feed (local + remote)
// - Builds a simple user preference profile from activity
// - Optionally uses a tiny transformer.js model (if available) to score posts
// - Returns the same posts, re-ordered by relevance while respecting BFS distance

import type { FeedItem } from './feed'
import type { PostsByUser } from './feed'

// Minimal summary of what the user seems to like.
export interface UserActivityProfile {
  // Higher weight for authors whose posts the user has liked or interacted with.
  preferredAuthors: Record<string, number>
  // Simple keyword interest profile from liked posts' content.
  keywordWeights: Record<string, number>
}

// Try to learn a tiny profile from the posts we already have.
// For now we:
// - Look at posts authored by the viewer and posts they've liked
// - Count authors and content keywords
export function buildUserActivityProfile(
  viewerUsername: string,
  postsByUser: PostsByUser
): UserActivityProfile {
  const preferredAuthors: Record<string, number> = {}
  const keywordWeights: Record<string, number> = {}

  const normalizeToken = (token: string) =>
    token
      .toLowerCase()
      .replace(/[^a-z0-9#@]+/g, '')
      .trim()

  for (const posts of Object.values(postsByUser)) {
    for (const post of posts) {
      const isSelf = post.author_username?.split('@')[0] === viewerUsername
      const isLiked = !!post.isLiked
      if (!isSelf && !isLiked) continue

      const authorKey = post.author_username || ''
      if (authorKey) {
        preferredAuthors[authorKey] = (preferredAuthors[authorKey] ?? 0) + (isSelf ? 2 : 1)
      }

      // Crude keyword extraction from content
      const tokens = (post.content || '')
        .split(/\s+/)
        .map(normalizeToken)
        .filter((t) => t.length > 2 && !/^[0-9]+$/.test(t))

      for (const token of tokens) {
        keywordWeights[token] = (keywordWeights[token] ?? 0) + (isSelf ? 2 : 1)
      }
    }
  }

  return { preferredAuthors, keywordWeights }
}

// Optional transformer.js integration (lazy-loaded, no hard dependency).
// If the import fails, we fall back to pure heuristic ranking.
type TextEmbeddingPipeline =
  | ((input: string) => Promise<number[]>)
  | null

let embeddingPipelinePromise: Promise<TextEmbeddingPipeline> | null = null

async function getEmbeddingPipeline(): Promise<TextEmbeddingPipeline> {
  if (embeddingPipelinePromise) return embeddingPipelinePromise

  embeddingPipelinePromise = (async () => {
    try {
      const mod = await import('@xenova/transformers')
      const pipe = await mod.pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
      return async (text: string) => {
        const output = await pipe(text, { pooling: 'mean', normalize: true }) as {
          data?: Float32Array | number[] | ArrayLike<number>
        }
        const data = output.data
        if (!data) return []
        return Array.isArray(data) ? (data as number[]) : Array.from(data as ArrayLike<number>)
      }
    } catch {
      return null
    }
  })()

  return embeddingPipelinePromise
}

function dot(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length)
  let s = 0
  for (let i = 0; i < len; i++) s += a[i] * b[i]
  return s
}

// Build a tiny "interest embedding" from top keywords.
function buildUserInterestText(profile: UserActivityProfile): string {
  const topKeywords = Object.entries(profile.keywordWeights)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word)

  const topAuthors = Object.entries(profile.preferredAuthors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([author]) => author.split('@')[0])

  const parts: string[] = []
  if (topKeywords.length) {
    parts.push(`interested in topics: ${topKeywords.join(', ')}`)
  }
  if (topAuthors.length) {
    parts.push(`likes posts from: ${topAuthors.join(', ')}`)
  }

  return parts.join('. ')
}

// Main entry: re-rank feed items using a combination of:
// - BFS distance (closer authors first)
// - Recency
// - Affinity to user's activity (authors + keywords)
// - Optional semantic similarity via transformer.js when available
export async function rerankFeedItems(
  feed: FeedItem[],
  profile: UserActivityProfile
): Promise<FeedItem[]> {
  if (feed.length === 0) return feed

  const now = Date.now()

  const userInterestText = buildUserInterestText(profile)
  const embed = await getEmbeddingPipeline()
  let userEmbedding: number[] | null = null

  if (embed && userInterestText) {
    try {
      userEmbedding = await embed(userInterestText)
    } catch {
      userEmbedding = null
    }
  }

  const scored = await Promise.all(
    feed.map(async (item) => {
      // Base score from graph distance (closer is better)
      const distancePenalty = item.distance ?? 0

      // Recency: newer posts get small positive boost
      const createdAt = item.created_at ? Date.parse(item.created_at) : now
      const hoursAgo = Math.max(0, (now - createdAt) / (1000 * 60 * 60))
      const recencyScore = -Math.log1p(hoursAgo) // 0 for very old, ~0 for new, negative as it ages

      // Author affinity
      const author = item.author_username || ''
      const authorAffinity = profile.preferredAuthors[author] ?? 0

      // Keyword affinity
      const tokens = (item.content || '')
        .toLowerCase()
        .split(/\s+/)
        .map((t) => t.replace(/[^a-z0-9#@]+/g, ''))
        .filter((t) => t.length > 2)
      let keywordAffinity = 0
      for (const t of tokens) {
        const w = profile.keywordWeights[t]
        if (w) keywordAffinity += w
      }

      // Optional semantic similarity
      let semanticScore = 0
      if (embed && userEmbedding && item.content) {
        try {
          const postEmbedding = await embed(item.content.slice(0, 500))
          semanticScore = dot(userEmbedding, postEmbedding)
        } catch {
          semanticScore = 0
        }
      }

      // Combine into a single score.
      const score =
        -distancePenalty * 1.5 +
        recencyScore * 1.0 +
        authorAffinity * 2.0 +
        keywordAffinity * 0.2 +
        semanticScore * 0.5

      return { item, score }
    })
  )

  return scored
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item)
}

