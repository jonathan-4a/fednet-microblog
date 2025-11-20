import type { Context } from "hono";
import type {
  IGetAdminDashboard,
  IListAdminUsers,
  IGetAdminUser,
  IEnableUser,
  IDisableUser,
  IDeleteUser,
  IListAdminPosts,
  IGetAdminPost,
  IUpdateAdminPost,
  IDeleteAdminPost,
  IGetServerSettings,
  IUpdateSettings,
  IListInviteTokens,
  IRevokeInviteToken,
} from "@admin/ports/in";

import type {
  AdminUserSummary,
  AdminPostSummaryOutput,
  AdminServerSettingsOutput,
} from "../../ports/in/Admin.dto";
import type { PaginatedResponseDto } from "@shared";
import {
  AdminInternalServerError,
  AdminValidationError,
  AdminBusinessRuleError,
} from "../../domain/AdminErrors";

export class AdminController {
  constructor(
    private readonly getAdminDashboard: IGetAdminDashboard,
    private readonly listAdminUsers: IListAdminUsers,
    private readonly getAdminUser: IGetAdminUser,
    private readonly enableUser: IEnableUser,
    private readonly disableUser: IDisableUser,
    private readonly deleteUser: IDeleteUser,
    private readonly listAdminPosts: IListAdminPosts,
    private readonly getAdminPost: IGetAdminPost,
    private readonly updateAdminPost: IUpdateAdminPost,
    private readonly deleteAdminPost: IDeleteAdminPost,
    private readonly getServerSettings: IGetServerSettings,
    private readonly updateSettingsCase: IUpdateSettings,
    private readonly listInviteTokens: IListInviteTokens,
    private readonly revokeInviteToken: IRevokeInviteToken,
  ) {}

  private getHost(): string {
    const domain = process.env.DOMAIN;
    const port = process.env.PORT;

    if (!domain || !port) {
      throw new AdminInternalServerError("DOMAIN and PORT must be configured");
    }

    return `${domain}:${port}`;
  }

  async dashboard(c: Context) {
    const data = await this.getAdminDashboard.execute({
      domain: this.getHost(),
    });
    return c.json(data);
  }

  async listUsers(c: Context) {
    const page = c.req.query("page") || undefined;
    const limit = c.req.query("limit") || undefined;
    const search = c.req.query("search") || undefined;
    const status = c.req.query("status") as
      | "all"
      | "active"
      | "inactive"
      | undefined;
    const sort = c.req.query("sort") || undefined;
    const order = c.req.query("order") as "asc" | "desc" | undefined;

    const filters = {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search,
      status,
      sortBy: sort as
        | "username"
        | "display_name"
        | "created_at"
        | "is_active"
        | undefined,
      sortOrder: order,
    };

    const data = await this.listAdminUsers.execute({
      domain: this.getHost(),
      filters,
    });

    const result: PaginatedResponseDto<AdminUserSummary> = {
      items: data.users,
      pagination: data.pagination,
    };

    return c.json(result);
  }

  async getUser(c: Context) {
    const id = c.req.param("id");
    const data = await this.getAdminUser.execute({
      username: id,
      domain: this.getHost(),
    });
    return c.json(data);
  }

  async updateUser(c: Context) {
    const id = c.req.param("id");
    const body = await c.req.json<{ is_active: boolean }>();
    const { is_active } = body;

    if (typeof is_active !== "boolean") {
      throw new AdminValidationError("is_active must be a boolean");
    }

    const result = is_active
      ? await this.enableUser.execute({ username: id })
      : await this.disableUser.execute({ username: id });

    return c.json({
      msg: is_active
        ? "User activated successfully"
        : "User deactivated successfully",
      ...result,
    });
  }

  async removeUser(c: Context) {
    const id = c.req.param("id");
    await this.deleteUser.execute({ username: id });
    return c.json({ msg: "User deleted successfully" });
  }

  async listPosts(c: Context) {
    const page = c.req.query("page") || undefined;
    const limit = c.req.query("limit") || undefined;
    const authorUsername = c.req.query("authorUsername") || undefined;

    const filters = {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      authorUsername,
    };

    const data = await this.listAdminPosts.execute(filters);
    const result: PaginatedResponseDto<AdminPostSummaryOutput> = {
      items: data.posts,
      pagination: data.pagination,
    };

    return c.json(result);
  }

  async getPost(c: Context) {
    const id = c.req.param("id");
    const result = await this.getAdminPost.execute({ guid: id });
    return c.json(result);
  }

  async updatePost(c: Context) {
    const id = c.req.param("id");
    const body = await c.req.json<{
      content?: string;
      is_deleted?: boolean;
    }>();
    const { content, is_deleted } = body;

    const result = await this.updateAdminPost.execute({
      guid: id,
      content,
      is_deleted,
    });

    return c.json(result);
  }

  async deletePost(c: Context) {
    const id = c.req.param("id");
    await this.deleteAdminPost.execute({ guid: id });
    return c.json({ msg: "Post deleted successfully" });
  }

  async getSettings(): Promise<Response> {
    const result = await this.getServerSettings.execute();
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  }

  async updateSettings(c: Context) {
    const body = await c.req.json<AdminServerSettingsOutput>();
    const { registration_mode, allow_public_peers, auto_fetch_peer_links } =
      body;

    const result = await this.updateSettingsCase.execute({
      registration_mode,
      allow_public_peers,
      auto_fetch_peer_links,
    });

    return c.json(result);
  }

  async listInvites(c: Context) {
    const result = await this.listInviteTokens.execute();
    return c.json(result);
  }

  async revokeInvite(c: Context) {
    const token = c.req.param("token");
    const result = await this.revokeInviteToken.execute({ token });

    if (!result.success) {
      throw new AdminBusinessRuleError(result.message);
    }

    return c.json(result);
  }
}

