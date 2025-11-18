// src/admin/usecases/GetAdminDashboard.ts

import type { IAdminUserRepository } from "../ports/out/IAdminUserRepository";
import type { IAdminPostRepository } from "../ports/out/IAdminPostRepository";
import type {
  AdminDashboard,
  IGetAdminDashboard,
} from "../ports/in/IGetAdminDashboard";

const toIso = (seconds: number) => new Date(seconds * 1000).toISOString();

export class GetAdminDashboard implements IGetAdminDashboard {
  constructor(
    private readonly adminUserRepository: IAdminUserRepository,
    private readonly adminPostRepository: IAdminPostRepository,
  ) {}

  async execute(input: { domain: string }): Promise<AdminDashboard> {
    const { domain } = input;
    const [totalUsers, activeUsers, totalPosts, recentUsers] =
      await Promise.all([
        this.adminUserRepository.countAll(),
        this.adminUserRepository.countActive(),
        this.adminPostRepository.countAll(),
        this.adminUserRepository.findRecent(10),
      ]);

    return {
      stats: {
        total_users: totalUsers,
        active_users: activeUsers,
        inactive_users: totalUsers - activeUsers,
        total_posts: totalPosts,
      },
      recent_activity: {
        users: recentUsers.map((user) => ({
          username: user.username,
          address: `${user.username}@${domain}`,
          display_name: user.display_name,
          created_at: toIso(user.created_at),
          is_active: user.is_active === 1,
        })),
      },
    };
  }
}

