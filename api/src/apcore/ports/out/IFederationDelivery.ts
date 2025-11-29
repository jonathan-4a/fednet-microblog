// src/apcore/ports/out/IFederationDelivery.ts

export interface IFederationDelivery {
  sendToInbox(
    targetActor: string,
    activity: Record<string, unknown>,
  ): Promise<void>;
  verifyActorExists(actorUrl: string): Promise<boolean>;
}

export const IFEDERATION_DELIVERY = "IFederationDelivery";

