export function normalizeNoteIdUrl(url: string): string {
  let normalized = url;

  if (normalized.includes("#") && normalized.includes("/u/")) {
    const match = normalized.match(/^(https?:\/\/[^/]+)\/u\/([^#]+)#(.+)$/);
    if (match) {
      const [, baseUrl, username, guid] = match;
      normalized = `${baseUrl}/u/${username}/statuses/${guid}`;
    }
  }

  normalized = normalized.replace(/^http:\/\/([^/:]+):80\//, "http://$1/");
  normalized = normalized.replace(/^https:\/\/([^/:]+):443\//, "https://$1/");

  return normalized;
}
