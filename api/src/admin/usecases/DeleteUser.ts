// src/admin/usecases/DeleteUser.ts

import type { IDeleteUser } from "../ports/in/IDeleteUser";
import type { IDeleteUserWithCascade } from "@users/usecases/DeleteUserWithCascade";
import { NotFoundError } from "@users/domain/UserErrors";
import { AdminNotFoundError } from "../domain/AdminErrors";

export class DeleteUser implements IDeleteUser {
  constructor(private readonly deleteUserWithCascade: IDeleteUserWithCascade) {}

  async execute(input: { username: string }): Promise<void> {
    try {
      await this.deleteUserWithCascade.execute(input);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new AdminNotFoundError("User not found");
      }
      throw error;
    }
  }
}
