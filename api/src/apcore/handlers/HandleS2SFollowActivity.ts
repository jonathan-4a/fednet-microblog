// src/apcore/handlers/HandleS2SFollowActivity.ts

import type { IFollowRepository } from "@socials";
import type { ActivityReceivedEvent } from "../domain/events/ActivityReceivedEvent";

export class HandleS2SFollowActivity {
  constructor(private readonly followRepository: IFollowRepository) {}

  async handle(event: ActivityReceivedEvent): Promise<void> {
    const { username, activity, host, protocol } = event.payload;

    const activityType =
      typeof activity.type === "string" ? activity.type : String(activity?.type);
    if (activityType !== "Follow") {
      return;
    }

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
    console.log(
      `[HandleS2SFollowActivity] Recorded follow: ${followerActor} -> ${followedActor}`,
    );
  }
}

