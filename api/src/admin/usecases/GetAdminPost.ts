// src/admin/usecases/GetAdminPost.ts

import type { IAdminPostRepository } from "../ports/out/IAdminPostRepository";
import type { IGetAdminPost } from "../ports/in/IGetAdminPost";
import type { AdminPostSummary } from "../ports/in/Admin.dto";
import { AdminNotFoundError } from "../domain/AdminErrors";

const toIso = (seconds: number) => new Date(seconds * 1000).toISOString();

export class GetAdminPost implements IGetAdminPost {
  constructor(private readonly adminPostRepository: IAdminPostRepository) {}

  async execute(input: { guid: string }): Promise<AdminPostSummary> {
    const { guid } = input;
    const post = await this.adminPostRepository.findByGuid(guid);

    if (!post) {
      throw new AdminNotFoundError("Post not found");
    }

    return {
      guid: post.guid,
      author_username: post.author_username,
      content: post.content ?? "",
      created_at: toIso(post.created_at),
      raw_message: undefined,
    };
  }
}

