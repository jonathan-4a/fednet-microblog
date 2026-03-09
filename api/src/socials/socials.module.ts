// src/socials/socials.module.ts

// Export use case classes
export { GetFollowers } from "./usecases/GetFollowers";
export { GetFollowing } from "./usecases/GetFollowing";

// Export repository
export { FollowRepository } from "./adapters/db/repository/FollowRepository";

// Export schema function
export { createFollowSchema } from "./adapters/db/models/FollowSchema";

// Export factory functions from di.ts
export {
  createFollowRepository,
  createGetFollowers,
  createGetFollowing,
  createSocialsRoutes,
} from "./socials.di";

// Export types
export type { IGetFollowers } from "./ports/in/IGetFollowers";
export type { IGetFollowing } from "./ports/in/IGetFollowing";
export type { FollowsTable } from "./adapters/db/models/FollowSchema";
export type { IFollowRepository } from "./ports/out/IFollowRepository";
