/**
 * Network-related constants
 */

// Local domains that should always be treated as local
export const LOCAL_DOMAINS = ['localhost', '127.0.0.1'] as const

/**
 * Check if a domain is a local domain
 */
export function isLocalDomain(domain: string): boolean {
  const domainLower = domain.toLowerCase()
  return LOCAL_DOMAINS.includes(domainLower as (typeof LOCAL_DOMAINS)[number])
}


