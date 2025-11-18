// src/admin/usecases/UpdateAdminPost.ts

import type { IAdminPostRepository } from "../ports/out/IAdminPostRepository";
import type { IUpdateAdminPost } from "../ports/in/IUpdateAdminPost";
import type { UpdateAdminPostInput } from "../ports/in/Admin.dto";
import {
  AdminValidationError,
  AdminNotFoundError,
} from "../domain/AdminErrors";

export class UpdateAdminPost implements IUpdateAdminPost {
  constructor(private readonly adminPostRepository: IAdminPostRepository) {}

  async execute(input: UpdateAdminPostInput): Promise<{ updated: boolean }> {
    const { guid, content, is_deleted } = input;

    if (content === undefined && is_deleted === undefined) {
      throw new AdminValidationError("No updates provided");
    }

    const result = await this.adminPostRepository.updateByGuid(guid, {
      content,
      is_deleted: is_deleted === undefined ? undefined : is_deleted ? 1 : 0,
    });

    if (result === 0) {
      throw new AdminNotFoundError("Post not found");
    }

    return { updated: true };
  }
}

