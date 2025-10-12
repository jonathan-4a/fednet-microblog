// src/users/adapters/http/UserController.ts
import type { Context } from "hono";
import type { AuthTokenPayload, IGenerateInviteToken } from "@auth";
import type { IGetUserProfile } from "../../ports/in/IGetUserProfile";
import type { IUpdateUserProfile } from "../../ports/in/IUpdateUserProfile";
import type { IDeleteUserAccount } from "../../ports/in/IDeleteUserAccount";
import type { ISearchUsers } from "../../ports/in/ISearchUsers";
import type { UpdateProfileInput } from "../../ports/in/Users.dto";

type AppContext = Context<{
  Variables: {
    user: AuthTokenPayload;
  };
}>;

export class UserController {
  constructor(
    private readonly getUserProfile: IGetUserProfile,
    private readonly updateUserProfile: IUpdateUserProfile,
    private readonly deleteUserAccount: IDeleteUserAccount,
    private readonly searchUsers: ISearchUsers,
    private readonly generateInviteToken: IGenerateInviteToken,
  ) {}

  async getOwnProfile(c: AppContext) {
    const user = c.get("user");

    return c.json(
      await this.getUserProfile.execute({
        username: user.username,
      }),
    );
  }

  async updateProfile(c: AppContext) {
    const user = c.get("user");

    const body = await c.req.json<UpdateProfileInput>();

    return c.json(
      await this.updateUserProfile.execute({
        username: user.username,
        displayName: body.displayName ?? "",
        summary: body.summary ?? "",
        isFollowingPublic: body.isFollowingPublic ?? false,
      }),
    );
  }

  async deleteAccount(c: AppContext) {
    const user = c.get("user");

    await this.deleteUserAccount.execute({
      username: user.username,
    });

    return c.body(null, 204);
  }

  async search(c: AppContext) {
    const user = c.get("user");

    const query = c.req.query("q") ?? c.req.query("query") ?? "";

    const limit = Number(c.req.query("limit") ?? 5);

    if (!query.trim()) {
      return c.json({ users: [] });
    }

    return c.json(
      await this.searchUsers.execute({
        query: query.trim(),
        limit,
        excludeUsername: user.username,
      }),
    );
  }

  async generateInvite(c: AppContext) {
    const user = c.get("user");

    const result = await this.generateInviteToken.execute({
      username: user.username,
    });

    return c.json(result, 201);
  }
}

