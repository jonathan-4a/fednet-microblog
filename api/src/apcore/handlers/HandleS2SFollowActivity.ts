// src/apcore/handlers/HandleS2SFollowActivity.ts

import type { IFollowRepository } from "@socials";
import type { INotificationActivityEmitter } from "../ports/out/INotificationActivityEmitter";
import type { ActivityReceivedEvent } from "../domain/events/ActivityReceivedEvent";

export class HandleS2SFollowActivity {
  constructor(
    private readonly followRepository: IFollowRepository,
    private readonly ourOrigin: string,
    private readonly notify: INotificationActivityEmitter | null = null,
  ) {}

  async handle(event: ActivityReceivedEvent): Promise<void> {
    const { username, activity, host, protocol } = event.payload;

    const activityType =
      typeof activity.type === "string"
        ? activity.type
        : String(activity?.type);

    if (activityType === "Follow") {
      const followerActor =
        typeof activity.actor === "string" ? activity.actor : undefined;
      const followedActor = `${protocol}://${host}/u/${username}`;

      if (!followerActor) {
        console.warn("[HandleS2SFollowActivity] Follow activity missing actor");
        return;
      }

      await this.followRepository.upsertFollow(
        followerActor,
        followedActor,
        "accepted",
      );
      const isRemote = new URL(followerActor).origin !== this.ourOrigin;
      if (this.notify && isRemote) {
        await this.notify.onFollowDone(followedActor, followerActor);
      }
      console.log(
        `[HandleS2SFollowActivity] Recorded follow: ${followerActor} -> ${followedActor}`,
      );
      return;
    }

    if (activityType === "Undo") {
      const obj = activity.object as Record<string, unknown> | undefined;
      const innerType = obj && typeof obj.type === "string" ? obj.type : "";
      if (innerType !== "Follow") return;

      const followerActor =
        typeof activity.actor === "string" ? activity.actor : undefined;
      const followedActor = `${protocol}://${host}/u/${username}`;

      if (!followerActor) return;

      const targetActor =
        typeof obj?.object === "string"
          ? obj.object
          : ((obj?.object as Record<string, unknown>)?.id as
              | string
              | undefined);
      if (!targetActor || targetActor !== followedActor) return;

      await this.followRepository.deleteFollow(followerActor, followedActor);
      console.log(
        `[HandleS2SFollowActivity] Recorded Undo follow: ${followerActor} -> ${followedActor}`,
      );
    }
  }
}
