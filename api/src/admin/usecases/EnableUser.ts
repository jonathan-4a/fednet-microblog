// src/admin/usecases/EnableUser.ts

import type { IAdminUserRepository } from "../ports/out/IAdminUserRepository";
import type { IEnableUser } from "../ports/in/IEnableUser";
import { AdminNotFoundError } from "../domain/AdminErrors";

export class EnableUser implements IEnableUser {
  constructor(private readonly adminUserRepository: IAdminUserRepository) {}

  async execute(input: { username: string }): Promise<{ is_active: boolean }> {
    const { username } = input;
    const user = await this.adminUserRepository.findByUsername(username);
    if (!user) {
      throw new AdminNotFoundError("User not found");
    }

    if (user.is_active === 1) {
      return { is_active: true };
    }

    await this.adminUserRepository.updateUserStatus(username, 1);
    return { is_active: true };
  }
}

