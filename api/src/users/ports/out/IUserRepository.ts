// src/users/ports/out/IUserRepository.ts
import type { CreateUserInput, UpdateUserFlagsInput } from "../in/Users.dto";

export type Transaction = unknown;

export interface IUserRepository {
  createUser(input: CreateUserInput, trx?: Transaction): Promise<void>;
  findUserByUsername(username: string): Promise<CreateUserInput | undefined>;
  updateUserFlags(
    input: UpdateUserFlagsInput,
    trx?: Transaction,
  ): Promise<void>;
  updateUserProfile(user: CreateUserInput, trx?: Transaction): Promise<void>;
  deleteUser(username: string, trx?: Transaction): Promise<number>;
  searchUsers(
    query: string,
    limit?: number,
    excludeUsername?: string,
  ): Promise<CreateUserInput[]>;
}

