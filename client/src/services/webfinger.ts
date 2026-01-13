import type { WebFingerResponse } from '../types/activitypub'

// GET /.well-known/webfinger
export async function getWebFinger(resource: string): Promise<string | null> {
  const match = resource.match(/^(?:acct:)?([^@]+)@([^:]+)(?::(\d+))?$/)
  if (!match) return null

  const [, username, domain, port] = match
  // Include port in acct resource if present
  const acctResource = port ? `acct:${username}@${domain}:${port}` : `acct:${username}@${domain}`
  const protocols: Array<'https' | 'http'> = ['https', 'http']

  for (const protocol of protocols) {
    const url =
      `${protocol}://${domain}` +
      `${port ? `:${port}` : ''}` +
      `/.well-known/webfinger?resource=${encodeURIComponent(acctResource)}`

    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/jrd+json, application/json',
        },
      })

      if (!response.ok) continue

      const data = (await response.json()) as WebFingerResponse | undefined
      const href = data?.links?.find(
        (link) =>
          link.rel === 'self' && link.type === 'application/activity+json'
      )?.href

      if (href) return href
    } catch {
      continue
    }
  }

  return null
}

