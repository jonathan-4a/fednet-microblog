// src/apcore/usecases/FanOutActivity.ts

import type { IFederationDelivery } from "../ports/out/IFederationDelivery";
import type { IFollowRepository } from "@socials";
import type {
  IFanOutActivity,
  FanOutActivityInput,
} from "../ports/in/IFanOutActivity";

export class FanOutActivity implements IFanOutActivity {
  constructor(
    private readonly followRepository: IFollowRepository,
    private readonly federationDelivery: IFederationDelivery,
  ) {}

  async execute(input: FanOutActivityInput): Promise<void> {
    const { actorUrl, activity } = input;

    try {
      const followers = await this.followRepository.getFollowers(actorUrl);

      // For replies: also deliver to the inbox of the person being replied to (per ActivityPub spec)
      const inReplyToAuthorActor = this.getInReplyToAuthorActor(activity);
      const extraTargets = inReplyToAuthorActor ? [inReplyToAuthorActor] : [];

      const allTargets = [
        ...followers.map((f) => f.actor),
        ...extraTargets.filter(
          (a) => !followers.some((f) => f.actor === a),
        ),
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
          // Continue with other deliveries even if one fails
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

  /** Extract actor URL of the author of the note being replied to. */
  private getInReplyToAuthorActor(activity: Record<string, unknown>): string | null {
    const obj = activity.object;
    if (!obj || typeof obj !== "object") return null;
    const inReplyTo = (obj as Record<string, unknown>).inReplyTo;
    if (typeof inReplyTo !== "string" || !inReplyTo) return null;
    try {
      const url = new URL(inReplyTo);
      const path = url.pathname;
      const match = path.match(/^(\/u\/[^/]+)/);
      if (!match) return null;
      return `${url.origin}${match[1]}`;
    } catch {
      return null;
    }
  }
}

