import type { IPostRepository } from "../ports/out/IPostRepository";
import type { IUpdatePost } from "../ports/in/IUpdatePost";
import type { UpdatePostInput } from "../ports/in/Posts.dto";
import { PostValidationError } from "../domain/PostsErrors";

export class UpdatePost implements IUpdatePost {
  constructor(private readonly postRepository: IPostRepository) {}

  async execute(input: UpdatePostInput): Promise<{ updated: boolean }> {
    const { guid, username, content } = input;

    if (!content || content.trim().length === 0) {
      throw new PostValidationError("Content cannot be empty");
    }

    const result = await this.postRepository.updateByGuid(guid, username, {
      content: content.trim(),
    });

    if (result === 0) {
      throw new PostValidationError("Post not found or unauthorized");
    }

    return { updated: true };
  }
}

