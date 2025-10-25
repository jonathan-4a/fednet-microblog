import type { IPostRepository } from "../ports/out/IPostRepository";
import type { IDeletePost } from "../ports/in/IDeletePost";
import type { DeletePostInput } from "../ports/in/Posts.dto";
import { PostNotFoundError, PostValidationError } from "../domain/PostsErrors";

export class DeletePost implements IDeletePost {
  constructor(private readonly postRepository: IPostRepository) {}

  async execute(input: DeletePostInput): Promise<{ deleted: boolean }> {
    const { guid, username } = input;

    console.log(
      `[DeletePost] Attempting to delete post with guid: ${guid}, username: ${username}`,
    );

    // First, try to find the post to see what author_username is stored
    const post = await this.postRepository.findByGuid(guid);
    if (post) {
      console.log(
        `[DeletePost] Found post with guid ${guid}, stored author_username: ${post.authorUsername}, requested username: ${username}`,
      );
    } else {
      console.warn(`[DeletePost] Post not found with guid: ${guid}`);
    }

    const result = await this.postRepository.deleteByGuid(guid, username);

    console.log(`[DeletePost] deleteByGuid returned ${result} rows updated`);

    if (result === 0) {
      if (post) {
        const errorMsg = `Post author mismatch: stored author_username="${post.authorUsername}", requested username="${username}"`;
        console.warn(`[DeletePost] Failed to delete post: ${errorMsg}`);
        throw new PostValidationError(errorMsg);
      }
      console.warn(`[DeletePost] Post not found with guid: ${guid}`);
      throw new PostNotFoundError(`Post not found with guid: ${guid}`);
    }

    console.log(
      `[DeletePost] Successfully deleted post: guid=${guid}, username=${username}`,
    );
    return { deleted: true };
  }
}

