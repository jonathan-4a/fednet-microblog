import type { INoteSerializer } from "@apcore";
import type { IPostRepository } from "../ports/out/IPostRepository";
import type { ILikesRepository } from "../ports/out/ILikesRepository";
import type { IAnnouncesRepository } from "../ports/out/IAnnouncesRepository";
import type { IGetPost } from "../ports/in/IGetPost";
import type { GetPostInput } from "../ports/in/Posts.dto";
import { PostNotFoundError } from "../domain/PostsErrors";

export class GetPost implements IGetPost {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly likesRepository: ILikesRepository,
    private readonly announcesRepository: IAnnouncesRepository,
    private readonly noteSerializer: INoteSerializer,
  ) {}

  async execute(input: GetPostInput): Promise<Record<string, unknown>> {
    const { guid, username, host, protocol } = input;

    const post = await this.postRepository.findByGuid(guid);
    if (!post) {
      throw new PostNotFoundError("Post not found");
    }

    // Normalize comparison: post.authorUsername might be stored as full URL or just username
    // For local posts created via outbox, it's usually just the username (e.g., "admin")
    // For remote posts, it's the full actor URL (e.g., "http://example.com/u/user")
    const expectedActorUrl = `${protocol}://${host}/u/${username}`;

    // Extract username from authorUsername if it's a URL
    const extractUsernameFromUrl = (url: string): string | null => {
      const match = url.match(/\/u\/([^/]+)$/);
      return match ? match[1] : null;
    };

    // Check if author matches:
    // 1. Direct username match (local posts: "admin" === "admin")
    // 2. Full actor URL match (remote posts or if stored as URL)
    // 3. Extract username from authorUsername URL and compare
    const authorMatches =
      post.authorUsername === username ||
      post.authorUsername === expectedActorUrl ||
      extractUsernameFromUrl(post.authorUsername) === username;

    if (!authorMatches) {
      throw new PostNotFoundError(
        `Post author mismatch: expected ${username} or ${expectedActorUrl}, got ${post.authorUsername}`,
      );
    }

    // Use /statuses/ format to match what's stored in likes table (from GetOutbox)
    const noteId = `${protocol}://${host}/u/${username}/statuses/${guid}`;
    const actorUrl = `${protocol}://${host}/u/${username}`;

    const likesCount = await this.likesRepository.countLikes(noteId);
    const sharesCount = await this.announcesRepository.countAnnounces(noteId);
    const repliesCount = await this.postRepository.countByInReplyTo(noteId);

    // Convert Unix timestamp (seconds) to ISO string
    // createdAt is stored as Unix timestamp in seconds, need to multiply by 1000 for Date constructor
    const publishedIso = new Date(post.createdAt * 1000).toISOString();

    const note = this.noteSerializer.create(
      noteId,
      actorUrl,
      post.content,
      publishedIso,
      post.inReplyTo ?? null,
      host,
      protocol,
      likesCount,
      sharesCount,
    );

    // Update replies collection with totalItems count
    if (note.replies && typeof note.replies === "object") {
      (note.replies as Record<string, unknown>).totalItems = repliesCount;
    }

    return note;
  }
}

