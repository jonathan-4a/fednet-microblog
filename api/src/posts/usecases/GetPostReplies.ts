import type { ICollectionSerializer } from "@apcore";
import type { IPostRepository } from "../ports/out/IPostRepository";
import type { IGetPostReplies } from "../ports/in/IGetPostReplies";
import type { GetPostRepliesInput } from "../ports/in/Posts.dto";
import { PostNotFoundError } from "../domain/PostsErrors";

export class GetPostReplies implements IGetPostReplies {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly collectionSerializer: ICollectionSerializer,
  ) {}

  async execute(input: GetPostRepliesInput): Promise<Record<string, unknown>> {
    const { guid, username, host, protocol, page = 1, limit = 20 } = input;

    const post = await this.postRepository.findByGuid(guid);
    if (!post) {
      throw new PostNotFoundError("Post not found");
    }

    // Note: We don't check post.authorUsername !== username because:
    // 1. ActivityPub spec allows accessing replies collection for any post
    // 2. The username in the URL is just part of the identifier, not a requirement
    // 3. Remote servers (like Mastodon) don't enforce this check
    // 4. The post GUID uniquely identifies the post, so username matching is unnecessary

    // Use /statuses/ format to match what's stored in posts.in_reply_to
    // Use the post's actual authorUsername for noteId to ensure correct matching
    const postAuthorUsername = post.authorUsername.includes("@")
      ? post.authorUsername.split("@")[0]
      : post.authorUsername.split("/").pop() || post.authorUsername;
    const noteId = `${protocol}://${host}/u/${postAuthorUsername}/statuses/${guid}`;
    const collectionId = `${protocol}://${host}/u/${username}/statuses/${guid}/replies`;

    const offset = (page - 1) * limit;

    // Get all replies (both local and remote) from posts table
    const replyPosts = await this.postRepository.findByInReplyTo(
      noteId,
      limit,
      offset,
    );
    const totalReplies = await this.postRepository.countByInReplyTo(noteId);

    // Build reply URLs: use noteId for remote posts, construct URL for local posts
    const allReplyUrls = replyPosts.map((replyPost) => {
      if (replyPost.noteId) {
        // Remote reply: use stored noteId (full ActivityPub URL)
        return replyPost.noteId;
      } else {
        // Local reply: construct URL from guid
        // Extract username from authorUsername (might be full URL or just username)
        let replyAuthorUsername = replyPost.authorUsername;
        if (replyPost.authorUsername.includes("/u/")) {
          // Extract username from URL like "http://localhost:3000/u/admin"
          const match = replyPost.authorUsername.match(/\/u\/([^/]+)/);
          replyAuthorUsername = match ? match[1] : replyPost.authorUsername;
        } else if (replyPost.authorUsername.includes("@")) {
          // Extract username from handle like "admin@localhost:3000"
          replyAuthorUsername = replyPost.authorUsername.split("@")[0];
        }
        return `${protocol}://${host}/u/${replyAuthorUsername}/statuses/${replyPost.guid}`;
      }
    });
    const nextPage =
      page * limit < totalReplies
        ? `${collectionId}?page=${page + 1}&limit=${limit}`
        : null;

    const firstPage = this.collectionSerializer.createOrderedCollectionPage(
      collectionId,
      collectionId,
      allReplyUrls,
      nextPage,
    );

    const collection = this.collectionSerializer.createOrderedCollection(
      collectionId,
      totalReplies,
    );
    collection.first = firstPage;
    return collection;
  }
}

