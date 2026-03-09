// src/apcore/utils/inReplyToActor.ts
export function getInReplyToAuthorActor(
  activity: Record<string, unknown>,
): string | null {
  const obj = activity.object;
  if (!obj || typeof obj !== "object") return null;
  const inReplyTo = (obj as Record<string, unknown>).inReplyTo;
  if (typeof inReplyTo !== "string" || !inReplyTo) return null;
  try {
    const url = new URL(inReplyTo);
    const path = url.pathname;
    const match =
      path.match(/^(\/u\/[^/]+)/) ?? path.match(/^(\/users\/[^/]+)/);
    if (!match) return null;
    return `${url.origin}${match[1]}`;
  } catch {
    return null;
  }
}
