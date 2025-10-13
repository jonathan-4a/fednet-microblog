// src/users/users.module.ts
export { createUserSchema } from "./adapters/db/models/UserSchema";

// Export factory functions from di.ts
export {
  createUserRepository,
  createUserEntity,
  createGetUserProfile,
  createUpdateUserProfile,
  createDeleteUserAccount,
  createDeleteUserWithCascade,
  createSearchUsers,
  createUsersRoutes,
} from "./users.di";

// Export types
export type {
  CreateUserInput,
  AuthenticatedUserOutput,
} from "./ports/in/Users.dto";
export type { IUserRepository } from "./ports/out/IUserRepository";
export type { IGetUserProfile } from "./ports/in/IGetUserProfile";
export type { IUpdateUserProfile } from "./ports/in/IUpdateUserProfile";
export type { IDeleteUserAccount } from "./ports/in/IDeleteUserAccount";
export type { ISearchUsers } from "./ports/in/ISearchUsers";
export type { UsersTable } from "./adapters/db/models/UserSchema";

