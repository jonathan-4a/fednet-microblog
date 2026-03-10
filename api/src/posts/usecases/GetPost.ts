import type { INoteSerializer } from "@apcore";
import type { IPostRepository } from "../ports/out/IPostRepository";
import type { ILikesRepository } from "../ports/out/ILikesRepository";
import type { IAnnouncesRepository } from "../ports/out/IAnnouncesRepository";
import type { IGetPost } from "../ports/in/IGetPost";
import type { GetPostInput } from "../ports/in/Posts.dto";
import { extractUsernameFromActorUrl } from "../utils/author";
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

    const expectedActorUrl = `${protocol}://${host}/u/${username}`;

    const authorMatches =
      post.authorUsername === username ||
      post.authorUsername === expectedActorUrl ||
      extractUsernameFromActorUrl(post.authorUsername) === username;

    if (!authorMatches) {
      throw new PostNotFoundError(
        `Post author mismatch: expected ${username} or ${expectedActorUrl}, got ${post.authorUsername}`,
      );
    }

    const noteId = `${protocol}://${host}/u/${username}/statuses/${guid}`;
    const actorUrl = `${protocol}://${host}/u/${username}`;

    const likesCount = await this.likesRepository.countLikes(noteId);
    const sharesCount = await this.announcesRepository.countAnnounces(noteId);
    const repliesCount = await this.postRepository.countByInReplyTo(noteId);

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

    if (note.replies && typeof note.replies === "object") {
      (note.replies as Record<string, unknown>).totalItems = repliesCount;
    }

    return note;
  }
}
