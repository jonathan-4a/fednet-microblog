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
import {
  createPostRepository,
  createLikesRepository,
  createAnnouncesRepository,
} from "@posts";
import { createFollowRepository } from "@socials";

export function createUserRepository(db: Kysely<{ users: UsersTable }>) {
  return new UserRepository(db);
}

export function createUserEntity(data: CreateUserInput) {
  return new UserEntity(data);
}

export function createGetUserProfile(db: Kysely<{ users: UsersTable }>) {
  const userRepository = createUserRepository(db);
  return new GetUserProfile(userRepository);
}

export function createUpdateUserProfile(db: Kysely<{ users: UsersTable }>) {
  const userRepository = createUserRepository(db);
  return new UpdateUserProfile(userRepository);
}

export function createSearchUsers(db: Kysely<{ users: UsersTable }>) {
  const userRepository = createUserRepository(db);
  return new SearchUsers(userRepository);
}

export function createDeleteUserWithCascade<
  T extends {
    users: UsersTable;
    posts: import("@posts").PostsTable;
    likes: import("@posts").LikesTable;
    announces: import("@posts").AnnouncesTable;
    follows: import("@socials").FollowsTable;
  },
>(db: Kysely<T>, transactionManager: ITransactionManager) {
  const userRepository = createUserRepository(db);
  const postRepository = createPostRepository(db);
  const likesRepository = createLikesRepository(db);
  const announcesRepository = createAnnouncesRepository(db);
  const followRepository = createFollowRepository(db);
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
  db: Kysely<{ users: UsersTable }>,
  transactionManager: ITransactionManager,
) {
  const deleteUserWithCascade = createDeleteUserWithCascade(
    db as Parameters<typeof createDeleteUserWithCascade>[0],
    transactionManager,
  );
  return new DeleteUserAccount(deleteUserWithCascade);
}

export function createUsersRoutes(
  db: Kysely<{ users: UsersTable }>,
  transactionManager: ITransactionManager,
  authMiddleware: AuthMiddleware,
  generateInviteToken: IGenerateInviteToken,
) {
  const getUserProfile = createGetUserProfile(db);
  const updateUserProfile = createUpdateUserProfile(db);
  const deleteUserAccount = createDeleteUserAccount(db, transactionManager);
  const searchUsers = createSearchUsers(db);

  return createUsersRoutesFactory(
    getUserProfile,
    updateUserProfile,
    deleteUserAccount,
    searchUsers,
    authMiddleware,
    generateInviteToken,
  );
}

