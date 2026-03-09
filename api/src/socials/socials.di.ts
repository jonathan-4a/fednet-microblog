// src/socials/socials.di.ts

import type { Kysely } from "kysely";
import type { ICollectionSerializer } from "@apcore";
import type { IUserRepository } from "@users";
import type { IGetLiked } from "@posts";
import type { IFollowRepository } from "./ports/out/IFollowRepository";
import { GetFollowers } from "./usecases/GetFollowers";
import { GetFollowing } from "./usecases/GetFollowing";
import { FollowRepository } from "./adapters/db/repository/FollowRepository";
import { createSocialsRoutes as createSocialsRoutesFactory } from "./adapters/http/SocialsRoutes";
import type { FollowsTable } from "./adapters/db/models/FollowSchema";

export function createFollowRepository(
  db: Kysely<{ follows: FollowsTable }>,
): FollowRepository {
  return new FollowRepository(db);
}

export function createGetFollowers(
  followRepository: IFollowRepository,
  userRepository: IUserRepository,
  collectionSerializer: ICollectionSerializer,
) {
  return new GetFollowers(
    followRepository,
    userRepository,
    collectionSerializer,
  );
}

export function createGetFollowing(
  followRepository: IFollowRepository,
  userRepository: IUserRepository,
  collectionSerializer: ICollectionSerializer,
) {
  return new GetFollowing(
    followRepository,
    userRepository,
    collectionSerializer,
  );
}

export function createSocialsRoutes(
  followRepository: IFollowRepository,
  userRepository: IUserRepository,
  getLiked: IGetLiked,
  collectionSerializer: ICollectionSerializer,
  host: string,
  protocol: string,
) {
  const getFollowers = createGetFollowers(
    followRepository,
    userRepository,
    collectionSerializer,
  );
  const getFollowing = createGetFollowing(
    followRepository,
    userRepository,
    collectionSerializer,
  );
  return createSocialsRoutesFactory(
    getFollowers,
    getFollowing,
    getLiked,
    host,
    protocol,
  );
}
