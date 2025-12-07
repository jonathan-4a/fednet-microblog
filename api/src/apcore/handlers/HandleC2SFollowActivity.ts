// src/apcore/handlers/HandleC2SFollowActivity.ts

import type { IFollowRepository } from "@socials";
import type { IFederationDelivery } from "../ports/out/IFederationDelivery";
import type { C2SActivitySubmittedEvent } from "../domain/events/C2SActivitySubmittedEvent";

export class HandleC2SFollowActivity {
  constructor(
    private readonly followRepository: IFollowRepository,
    private readonly federationDelivery: IFederationDelivery,
  ) {}

  async handle(event: C2SActivitySubmittedEvent): Promise<void> {
    const { username, activity, host, protocol, responseCallback } =
      event.payload;

    const activityType =
      typeof activity.type === "string" ? activity.type : String(activity?.type);
    if (activityType !== "Follow" && activityType !== "Undo") {
      return;
    }

    const actorUrl = `${protocol}://${host}/u/${username}`;
    const followerActor =
      typeof activity.actor === "string" ? activity.actor : actorUrl;

    try {
      if (activityType === "Follow") {
        const targetActor =
          typeof activity.object === "string"
            ? activity.object
            : (activity.object as Record<string, unknown>)?.id as
                | string
                | undefined;
        if (!targetActor) {
          throw new Error("Follow activity missing object (target actor)");
        }
        await this.followRepository.upsertFollow(
          followerActor,
          targetActor,
          "accepted",
        );
        await this.federationDelivery.sendToInbox(targetActor, activity);
        responseCallback?.();
      } else if (activityType === "Undo") {
        const obj = activity.object as Record<string, unknown> | string;
        const innerType =
          typeof obj === "object" && obj?.type !== undefined
            ? String(obj.type)
            : "";
        if (innerType === "Follow") {
          const targetActor =
            typeof (obj as Record<string, unknown>).object === "string"
              ? ((obj as Record<string, unknown>).object as string)
              : ((obj as Record<string, unknown>).object as Record<string, unknown>)
                  ?.id as string | undefined;
          if (targetActor) {
            await this.followRepository.deleteFollow(followerActor, targetActor);
            await this.federationDelivery.sendToInbox(targetActor, activity);
          }
        }
        responseCallback?.();
      }
    } catch (error) {
      console.error("[HandleC2SFollowActivity]", error);
      responseCallback?.(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }
}

