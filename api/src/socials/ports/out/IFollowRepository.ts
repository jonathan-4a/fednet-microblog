// src/socials/ports/out/IFollowRepository.ts

export type FollowStatus = "pending" | "accepted";

export interface FollowRecord {
  actor: string;
  createdAt: number;
}

export interface IFollowRepository {
  getFollowers(followedActor: string): Promise<FollowRecord[]>;
  getFollowing(followerActor: string): Promise<FollowRecord[]>;
  upsertFollow(
    followerActor: string,
    followedActor: string,
    status: FollowStatus,
  ): Promise<void>;
  updateFollowStatus(
    followerActor: string,
    followedActor: string,
    status: FollowStatus,
  ): Promise<void>;
  deleteFollow(followerActor: string, followedActor: string): Promise<void>;
  deleteAllByActor(actor: string, trx?: unknown): Promise<number>;
}
