// src/users/users.di.ts
import type { Kysely } from "kysely";
import { GetUserProfile } from "./usecases/GetUserProfile";
import { UpdateUserProfile } from "./usecases/UpdateUserProfile";
import { DeleteUserAccount } from "./usecases/DeleteUserAccount";
import { DeleteUserWithCascade } from "./usecases/DeleteUserWithCascade";
import { SearchUsers } from "./usecases/SearchUsers";
import { UserRepository } from "./adapters/db/repository/UserRepository";
import { UserEntity } from "./domain/UserEntity";
import type { CreateUserInput } from "./ports/in/Users.dto";
import {
  createUsersRoutes as createUsersRoutesFactory,
  type AuthMiddleware,
} from "./adapters/http/UsersRoutes";

import type { ITransactionManager } from "@shared";
import type { IGenerateInviteToken } from "@auth";
import type { UsersTable } from "./adapters/db/models/UserSchema";
import type { IUserRepository } from "./ports/out/IUserRepository";
import type { IDeleteUserWithCascade } from "./usecases/DeleteUserWithCascade";
import type {
  IPostRepository,
  ILikesRepository,
  IAnnouncesRepository,
} from "@posts";
import type { IFollowRepository } from "@socials";

export function createUserRepository(db: Kysely<{ users: UsersTable }>) {
  return new UserRepository(db);
}

export function createUserEntity(data: CreateUserInput) {
  return new UserEntity(data);
}

export function createGetUserProfile(userRepository: IUserRepository) {
  return new GetUserProfile(userRepository);
}

export function createUpdateUserProfile(userRepository: IUserRepository) {
  return new UpdateUserProfile(userRepository);
}

export function createSearchUsers(userRepository: IUserRepository) {
  return new SearchUsers(userRepository);
}

export function createDeleteUserWithCascade(
  userRepository: IUserRepository,
  postRepository: IPostRepository,
  likesRepository: ILikesRepository,
  announcesRepository: IAnnouncesRepository,
  followRepository: IFollowRepository,
  transactionManager: ITransactionManager,
) {
  return new DeleteUserWithCascade(
    userRepository,
    postRepository,
    likesRepository,
    announcesRepository,
    followRepository,
    transactionManager,
  );
}

export function createDeleteUserAccount(
  deleteUserWithCascade: IDeleteUserWithCascade,
) {
  return new DeleteUserAccount(deleteUserWithCascade);
}

export function createUsersRoutes(
  userRepository: IUserRepository,
  transactionManager: ITransactionManager,
  authMiddleware: AuthMiddleware,
  generateInviteToken: IGenerateInviteToken,
  deleteUserWithCascade: IDeleteUserWithCascade,
) {
  const getUserProfile = createGetUserProfile(userRepository);
  const updateUserProfile = createUpdateUserProfile(userRepository);
  const deleteUserAccount = createDeleteUserAccount(deleteUserWithCascade);
  const searchUsers = createSearchUsers(userRepository);

  return createUsersRoutesFactory(
    getUserProfile,
    updateUserProfile,
    deleteUserAccount,
    searchUsers,
    authMiddleware,
    generateInviteToken,
  );
}
