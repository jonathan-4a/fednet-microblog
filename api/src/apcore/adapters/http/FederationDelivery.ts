// src/apcore/adapters/http/FederationDelivery.ts

import type { IFederationDelivery } from "../../ports/out/IFederationDelivery";
import type { HttpSignatureService } from "./HttpSignatureService";
import {
  MissingActorError,
  InboxNotFoundError,
  FetchError,
  InvalidActorUrlError,
} from "../../domain/ActivityPubErrors";

export class FederationDelivery implements IFederationDelivery {
  constructor(private readonly httpSignatureService: HttpSignatureService) {}

  async sendToInbox(
    targetActor: string,
    activity: Record<string, unknown>,
  ): Promise<void> {
    try {
      const { inbox: targetInbox, domain: targetDomain } =
        await this.discoverInbox(targetActor);

      const currentActor = activity.actor as string;
      if (!currentActor) {
        throw new MissingActorError();
      }

      const username = this.extractUsernameFromActor(currentActor);
      const currentDomain = this.extractDomainFromActor(currentActor);

      await this.signAndSend(
        activity,
        username,
        currentDomain,
        targetDomain,
        targetInbox,
      );
    } catch (error) {
      console.error(
        `Failed to send activity to inbox: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  async verifyActorExists(actorUrl: string): Promise<boolean> {
    try {
      const response = await fetch(actorUrl, {
        headers: { Accept: "application/activity+json" },
      });

      if (!response.ok) {
        return false;
      }

      const actor = (await response.json()) as Record<string, unknown>;
      return !!actor && typeof actor === "object" && "inbox" in actor;
    } catch {
      return false;
    }
  }

  private async discoverInbox(actorUrl: string): Promise<{
    inbox: string;
    domain: string;
  }> {
    try {
      const response = await fetch(actorUrl, {
        headers: { Accept: "application/activity+json" },
      });

      if (!response.ok) {
        throw new FetchError(`HTTP ${response.status}: Failed to fetch actor`);
      }

      const actor = (await response.json()) as Record<string, unknown>;
      const inbox = actor.inbox as string | undefined;

      if (!inbox) {
        throw new InboxNotFoundError();
      }

      const inboxUrl = new URL(inbox);
      return { inbox, domain: inboxUrl.host };
    } catch (error) {
      throw new FetchError(
        `Failed to discover inbox for ${actorUrl}: ${(error as Error).message}`,
      );
    }
  }

  private async signAndSend(
    message: Record<string, unknown>,
    username: string,
    domain: string,
    targetDomain: string,
    inbox: string,
  ): Promise<void> {
    const messageBody = JSON.stringify(message);

    // Use HttpSignatureService to sign the request
    const signedHeaders = await this.httpSignatureService.signRequest({
      method: "POST",
      url: inbox,
      targetDomain,
      username,
      body: messageBody,
    });

    console.log(
      `[FederationDelivery] Sending to ${inbox}, body length: ${messageBody.length}`,
    );

    const response = await fetch(inbox, {
      method: "POST",
      headers: {
        ...signedHeaders,
        "Content-Type": "application/activity+json",
      },
      body: messageBody,
    });

    console.log(`[FederationDelivery] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new FetchError(`HTTP ${response.status}: ${errorText}`);
    }
  }

  private extractUsernameFromActor(actorUrl: string): string {
    const match = actorUrl.match(/\/u\/([^/]+)$/);
    if (!match) {
      throw new InvalidActorUrlError(`Invalid actor URL format: ${actorUrl}`);
    }
    return match[1];
  }

  private extractDomainFromActor(actorUrl: string): string {
    try {
      const url = new URL(actorUrl);
      return url.host;
    } catch {
      throw new InvalidActorUrlError(`Invalid actor URL format: ${actorUrl}`);
    }
  }
}

