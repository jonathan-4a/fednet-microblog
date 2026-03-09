// src/users/usecases/SearchUsers.ts

import type { IUserRepository } from "../ports/out/IUserRepository";
import type { ISearchUsers } from "../ports/in/ISearchUsers";
import type { SearchUsersInput } from "../ports/in/Users.dto";
import { SearchUsersOutput } from "../ports/in/Users.dto";

export class SearchUsers implements ISearchUsers {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: SearchUsersInput): Promise<SearchUsersOutput> {
    const users = await this.userRepository.searchUsers(
      input.query,
      input.limit,
      input.excludeUsername,
    );

    return {
      users: users.map((user) => ({
        username: user.username,
        displayName: user.displayName,
        summary: user.summary,
        isFollowingPublic: user.isFollowingPublic,
        createdAt: user.createdAt,
      })),
    };
  }
}
