export function buildQueryString(
  params: Record<string, string | number | undefined>
): string {
  const queryParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      queryParams.append(key, value.toString())
    }
  }

  const query = queryParams.toString()
  return query ? `?${query}` : ''
}

