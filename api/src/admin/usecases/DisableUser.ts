// src/admin/usecases/DisableUser.ts

import type { IAdminUserRepository } from "../ports/out/IAdminUserRepository";
import type { IDisableUser } from "../ports/in/IDisableUser";
import { AdminNotFoundError } from "../domain/AdminErrors";

export class DisableUser implements IDisableUser {
  constructor(private readonly adminUserRepository: IAdminUserRepository) {}

  async execute(input: { username: string }): Promise<{ is_active: boolean }> {
    const { username } = input;
    const user = await this.adminUserRepository.findByUsername(username);
    if (!user) {
      throw new AdminNotFoundError("User not found");
    }

    if (user.is_active === 0) {
      return { is_active: false };
    }

    await this.adminUserRepository.updateUserStatus(username, 0);
    return { is_active: false };
  }
}

