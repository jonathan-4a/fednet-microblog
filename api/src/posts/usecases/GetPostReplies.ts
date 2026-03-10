import type { ICollectionSerializer } from "@apcore";
import type { IPostRepository } from "../ports/out/IPostRepository";
import type { IGetPostReplies } from "../ports/in/IGetPostReplies";
import type { GetPostRepliesInput } from "../ports/in/Posts.dto";
import { getLocalPartFromAuthor } from "../utils/author";
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

    const postAuthorUsername = getLocalPartFromAuthor(post.authorUsername);
    const noteId = `${protocol}://${host}/u/${postAuthorUsername}/statuses/${guid}`;
    const collectionId = `${protocol}://${host}/u/${username}/statuses/${guid}/replies`;

    const offset = (page - 1) * limit;

    const replyPosts = await this.postRepository.findByInReplyTo(
      noteId,
      limit,
      offset,
    );
    const totalReplies = await this.postRepository.countByInReplyTo(noteId);

    const allReplyUrls = replyPosts.map((replyPost) => {
      if (replyPost.noteId) {
        return replyPost.noteId;
      }

      const replyAuthorUsername = getLocalPartFromAuthor(
        replyPost.authorUsername,
      );
      return `${protocol}://${host}/u/${replyAuthorUsername}/statuses/${replyPost.guid}`;
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
