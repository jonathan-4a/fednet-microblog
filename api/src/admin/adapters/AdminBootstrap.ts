// src/admin/adapters/AdminBootstrap.ts

import { EnsureAdminUser } from "../usecases/EnsureAdminUser";
import { AdminInternalServerError } from "../domain/AdminErrors";

export class AdminBootstrap {
  constructor(private readonly ensureAdminUser: EnsureAdminUser) {}

  async run(): Promise<void> {
    const username = process.env.ADMIN_USER;
    const password = process.env.ADMIN_PASS;
    const displayName = process.env.ADMIN_DISPLAY_NAME ?? "admin";
    const summary = process.env.ADMIN_SUMMARY ?? "Server Administrator";

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

