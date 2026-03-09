// src/admin/usecases/ListAdminPosts.ts

import type {
  IAdminPostRepository,
  PostsPaginationParams,
} from "../ports/out/IAdminPostRepository";
import type { IListAdminPosts } from "../ports/in/IListAdminPosts";
import type {
  AdminPaginatedPosts,
  AdminPostSummary,
} from "../ports/in/Admin.dto";

const toIso = (seconds: number) => new Date(seconds * 1000).toISOString();

export class ListAdminPosts implements IListAdminPosts {
  constructor(private readonly adminPostRepository: IAdminPostRepository) {}

  async execute(params: PostsPaginationParams): Promise<AdminPaginatedPosts> {
    const { posts, total, page, limit } =
      await this.adminPostRepository.paginate(params);

    const summaries: AdminPostSummary[] = posts.map((post) => ({
      guid: post.guid,
      author_username: post.author_username,
      content: post.content ?? "",
      created_at: toIso(post.created_at),
      raw_message: undefined,
    }));

    return {
      posts: summaries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }
}
