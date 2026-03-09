export function extractUsernameFromActorUrl(url: string): string | null {
  const match = url.match(/\/u\/([^/]+)$/);
  return match ? match[1] : null;
}

export function getLocalPartFromAuthor(author: string): string {
  if (!author) {
    return author;
  }

  if (author.includes("/u/")) {
    const match = author.match(/\/u\/([^/]+)/);
    if (match) {
      return match[1];
    }
  }

  if (author.includes("@")) {
    return author.split("@")[0];
  }

  const segments = author.split("/");
  return segments.pop() || author;
}
