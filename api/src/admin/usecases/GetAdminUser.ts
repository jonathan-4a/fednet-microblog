// src/admin/usecases/GetAdminUser.ts

import type { IAdminUserRepository } from "../ports/out/IAdminUserRepository";
import type { IAdminPostRepository } from "../ports/out/IAdminPostRepository";
import type { IGetAdminUser } from "../ports/in/IGetAdminUser";
import type { AdminUserDetails, AdminPostSummary } from "../ports/in/Admin.dto";
import { AdminNotFoundError } from "../domain/AdminErrors";

const toIso = (seconds: number) => new Date(seconds * 1000).toISOString();

export class GetAdminUser implements IGetAdminUser {
  constructor(
    private readonly adminUserRepository: IAdminUserRepository,
    private readonly adminPostRepository: IAdminPostRepository,
  ) {}

  async execute(input: {
    username: string;
    domain: string;
  }): Promise<AdminUserDetails> {
    const { username, domain } = input;
    const user = await this.adminUserRepository.findByUsername(username);
    if (!user) {
      throw new AdminNotFoundError("User not found");
    }

    const [postCount, recentPosts] = await Promise.all([
      this.adminPostRepository.countByAuthor(username),
      this.adminPostRepository.findRecentByAuthor(username, 10),
    ]);

    const posts: AdminPostSummary[] = recentPosts.map((post) => ({
      guid: post.guid,
      author_username: post.author_username,
      content: post.content ?? "",
      created_at: toIso(post.created_at),
      raw_message: undefined,
    }));

    return {
      user: {
        username: user.username,
        address: `${user.username}@${domain}`,
        display_name: user.display_name,
        summary: user.summary,
        created_at: toIso(user.created_at),
        is_active: user.is_active === 1,
        is_admin: user.is_admin === 1,
        is_following_public: user.is_following_public === 1,
        post_count: postCount,
      },
      posts,
    };
  }
}

