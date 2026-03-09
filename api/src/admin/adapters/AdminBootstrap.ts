// src/admin/adapters/AdminBootstrap.ts

import { EnsureAdminUser } from "../usecases/EnsureAdminUser";
import { AdminInternalServerError } from "../domain/AdminErrors";

export interface AdminBootstrapConfig {
  username: string | undefined;
  password: string | undefined;
  displayName?: string;
  summary?: string;
}

export class AdminBootstrap {
  constructor(
    private readonly ensureAdminUser: EnsureAdminUser,
    private readonly config: AdminBootstrapConfig,
  ) {}

  async run(): Promise<void> {
    const {
      username,
      password,
      displayName = "admin",
      summary = "Server Administrator",
    } = this.config;

    if (!username || !password) {
      throw new AdminInternalServerError(
        "ADMIN_USER and ADMIN_PASS environment variables are required to bootstrap the admin account",
      );
    }

    await this.ensureAdminUser.execute({
      username,
      password,
      displayName,
      summary,
    });
  }
}
