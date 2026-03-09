// src/apcore/usecases/FanOutActivity.ts

import type { IFederationDelivery } from "../ports/out/IFederationDelivery";
import type { IFollowRepository } from "@socials";
import type {
  IFanOutActivity,
  FanOutActivityInput,
} from "../ports/in/IFanOutActivity";
import { getInReplyToAuthorActor } from "../utils/inReplyToActor";

export class FanOutActivity implements IFanOutActivity {
  constructor(
    private readonly followRepository: IFollowRepository,
    private readonly federationDelivery: IFederationDelivery,
    private readonly ourOrigin: string,
  ) {}

  async execute(input: FanOutActivityInput): Promise<void> {
    const { actorUrl, activity } = input;

    try {
      const followers = await this.followRepository.getFollowers(actorUrl);

      const inReplyToAuthorActor = getInReplyToAuthorActor(activity);
      const isRemoteReply =
        inReplyToAuthorActor !== null &&
        !inReplyToAuthorActor.startsWith(this.ourOrigin);
      const extraTargets =
        inReplyToAuthorActor && !isRemoteReply ? [inReplyToAuthorActor] : [];
      const allTargets = [
        ...followers.map((f) => f.actor),
        ...extraTargets.filter((a) => !followers.some((f) => f.actor === a)),
      ];

      if (allTargets.length === 0) {
        console.log(
          `[FanOutActivity] No followers or inReplyTo target for ${actorUrl}, skipping fan-out`,
        );
        return;
      }

      console.log(
        `[FanOutActivity] Fanning out activity to ${allTargets.length} inbox(es) for ${actorUrl}`,
      );

      const deliveryPromises = allTargets.map(async (targetActor) => {
        try {
          await this.federationDelivery.sendToInbox(targetActor, activity);
          console.log(
            `[FanOutActivity] Successfully delivered to ${targetActor}`,
          );
        } catch (error) {
          const err = error as Error;
          console.warn(
            `[FanOutActivity] Failed to deliver to ${targetActor}: ${err.message}`,
          );
        }
      });

      await Promise.allSettled(deliveryPromises);

      console.log(`[FanOutActivity] Completed fan-out for ${actorUrl}`);
    } catch (error) {
      const err = error as Error;
      console.error(
        `[FanOutActivity] Error during fan-out for ${actorUrl}: ${err.message}`,
      );
      throw error;
    }
  }
}
