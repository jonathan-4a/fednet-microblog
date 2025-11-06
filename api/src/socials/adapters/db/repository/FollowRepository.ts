// src/socials/adapters/db/repository/FollowRepository.ts

import type { Kysely } from "kysely";
import type { FollowsTable } from "../models/FollowSchema";
import type {
  IFollowRepository,
  FollowRecord,
  FollowStatus,
} from "../../../ports/out/IFollowRepository";

export class FollowRepository<
  DB extends { follows: FollowsTable } = { follows: FollowsTable },
> implements IFollowRepository {
  private readonly db: Kysely<{ follows: FollowsTable }>;

  constructor(db: Kysely<DB>) {
    this.db = db as unknown as Kysely<{ follows: FollowsTable }>;
  }

  async getFollowers(followedActor: string): Promise<FollowRecord[]> {
    const rows = await this.db
      .selectFrom("follows")
      .select(["follower_actor", "created_at"])
      .where("followed_actor", "=", followedActor)
      .where("status", "=", "accepted")
      .execute();

    return rows.map((row) => ({
      actor: row.follower_actor,
      createdAt: row.created_at,
    }));
  }

  async getFollowing(followerActor: string): Promise<FollowRecord[]> {
    const rows = await this.db
      .selectFrom("follows")
      .select(["followed_actor", "created_at"])
      .where("follower_actor", "=", followerActor)
      .where("status", "=", "accepted")
      .execute();

    return rows.map((row) => ({
      actor: row.followed_actor,
      createdAt: row.created_at,
    }));
  }

  async upsertFollow(
    followerActor: string,
    followedActor: string,
    status: FollowStatus,
  ): Promise<void> {
    console.log(
      `[DB] upsertFollow: ${followerActor} -> ${followedActor}, status=${status}`,
    );
    await this.db
      .insertInto("follows")
      .values({
        follower_actor: followerActor,
        followed_actor: followedActor,
        status,
        created_at: Math.floor(Date.now() / 1000),
      })
      .onConflict((oc) =>
        oc
          .columns(["follower_actor", "followed_actor"])
          .doUpdateSet({ status }),
      )
      .execute();
    console.log(
      `[DB] upsertFollow completed: ${followerActor} -> ${followedActor}, status=${status}`,
    );
  }

  async updateFollowStatus(
    followerActor: string,
    followedActor: string,
    status: FollowStatus,
  ): Promise<void> {
    console.log(
      `[DB] updateFollowStatus: ${followerActor} -> ${followedActor}, status=${status}`,
    );
    await this.db
      .updateTable("follows")
      .set({ status })
      .where("follower_actor", "=", followerActor)
      .where("followed_actor", "=", followedActor)
      .execute();
    console.log(
      `[DB] updateFollowStatus completed: ${followerActor} -> ${followedActor}, status=${status}`,
    );
  }

  async deleteFollow(
    followerActor: string,
    followedActor: string,
  ): Promise<void> {
    await this.db
      .deleteFrom("follows")
      .where("follower_actor", "=", followerActor)
      .where("followed_actor", "=", followedActor)
      .execute();
  }

  async deleteAllByActor(actor: string, trx?: unknown): Promise<number> {
    const db = (trx ?? this.db) as Kysely<{ follows: FollowsTable }>;
    const result = await db
      .deleteFrom("follows")
      .where((eb) =>
        eb.or([
          eb("follower_actor", "=", actor),
          eb("followed_actor", "=", actor),
        ]),
      )
      .executeTakeFirst();

    return Number(result?.numDeletedRows ?? 0);
  }
}

