// src/admin/usecases/DeleteAdminPost.ts

import type { IAdminPostRepository } from "../ports/out/IAdminPostRepository";
import type { IDeleteAdminPost } from "../ports/in/IDeleteAdminPost";
import { AdminNotFoundError } from "../domain/AdminErrors";

export class DeleteAdminPost implements IDeleteAdminPost {
  constructor(private readonly adminPostRepository: IAdminPostRepository) {}

  async execute(input: { guid: string }): Promise<void> {
    const deleted = await this.adminPostRepository.deleteByGuid(input.guid);

    if (deleted === 0) {
      throw new AdminNotFoundError("Post not found");
    }
  }
}
