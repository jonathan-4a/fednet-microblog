// src/socials/socials.di.ts

import type { Kysely } from "kysely";
import type { ICollectionSerializer } from "@apcore";
import { GetFollowers } from "./usecases/GetFollowers";
import { GetFollowing } from "./usecases/GetFollowing";
import { FollowRepository } from "./adapters/db/repository/FollowRepository";
import { createSocialsRoutes as createSocialsRoutesFactory } from "./adapters/http/SocialsRoutes";
import type { FollowsTable } from "./adapters/db/models/FollowSchema";
import { IUserRepository } from "@users";
import { IGetLiked } from "@posts";

export function createFollowRepository<T extends { follows: FollowsTable }>(
  db: Kysely<T>,
) {
  return new FollowRepository<T>(db);
}

export function createGetFollowers<
  T extends {
    follows: FollowsTable;
    users: import("@users").UsersTable;
  },
>(
  db: Kysely<T>,
  userRepository: IUserRepository,
  collectionSerializer: ICollectionSerializer,
) {
  const followRepository = createFollowRepository(db);
  return new GetFollowers(
    followRepository,
    userRepository,
    collectionSerializer,
  );
}

export function createGetFollowing<
  T extends {
    follows: FollowsTable;
    users: import("@users").UsersTable;
  },
>(
  db: Kysely<T>,
  userRepository: IUserRepository,
  collectionSerializer: ICollectionSerializer,
) {
  const followRepository = createFollowRepository(db);
  return new GetFollowing(
    followRepository,
    userRepository,
    collectionSerializer,
  );
}

export function createSocialsRoutes<
  T extends {
    follows: FollowsTable;
    users: import("@users").UsersTable;
  },
>(
  db: Kysely<T>,
  userRepository: IUserRepository,
  getLiked: IGetLiked,
  collectionSerializer: ICollectionSerializer,
) {
  const getFollowers = createGetFollowers(
    db,
    userRepository,
    collectionSerializer,
  );
  const getFollowing = createGetFollowing(
    db,
    userRepository,
    collectionSerializer,
  );

  return createSocialsRoutesFactory(getFollowers, getFollowing, getLiked);
}

