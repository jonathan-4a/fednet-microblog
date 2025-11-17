// src/admin/usecases/ListAdminUsers.ts

import type {
  IAdminUserRepository,
  UserListFilters,
} from "../ports/out/IAdminUserRepository";
import type { IAdminPostRepository } from "../ports/out/IAdminPostRepository";
import type { IListAdminUsers } from "../ports/in/IListAdminUsers";
import type {
  AdminPaginatedUsers,
  AdminUserSummary,
} from "../ports/in/Admin.dto";

const toIso = (seconds: number) => new Date(seconds * 1000).toISOString();

export class ListAdminUsers implements IListAdminUsers {
  constructor(
    private readonly adminUserRepository: IAdminUserRepository,
    private readonly adminPostRepository: IAdminPostRepository,
  ) {}

  async execute(input: {
    domain: string;
    filters: UserListFilters;
  }): Promise<AdminPaginatedUsers> {
    const { domain, filters } = input;
    const { users, total, page, limit } =
      await this.adminUserRepository.findWithFilters(filters);

    const summaries: AdminUserSummary[] = await Promise.all(
      users.map(async (user) => {
        const postCount = await this.adminPostRepository.countByAuthor(
          user.username,
        );

        return {
          username: user.username,
          address: `${user.username}@${domain}`,
          display_name: user.display_name,
          summary: user.summary,
          created_at: toIso(user.created_at),
          is_active: user.is_active === 1,
          is_admin: user.is_admin === 1,
          is_following_public: user.is_following_public === 1,
          post_count: postCount,
        };
      }),
    );

    return {
      users: summaries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }
}

