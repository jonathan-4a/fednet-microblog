// src/apcore/usecases/DispatchS2SActivityEvent.ts

import type { IEventBus } from "@shared";
import { ActivityReceivedEvent } from "../domain/events";
import { ConfigurationError } from "../domain/ActivityPubErrors";
import type { DispatchS2SActivityEventInput } from "../ports/in/ActivityPub.dto";
import type { IDispatchS2SActivityEvent } from "../ports/in/IDispatchS2SActivityEvent";

export class DispatchS2SActivityEvent implements IDispatchS2SActivityEvent {
  constructor(private readonly eventBus: IEventBus) {}

  execute(input: DispatchS2SActivityEventInput): void {
    const activityType =
      typeof input.activity?.type === "string"
        ? input.activity.type
        : JSON.stringify(input.activity?.type);

    console.log(
      `[DispatchS2SActivityEvent] Received inbox activity for ${input.username}: type=${activityType ?? "unknown"}, activity=${JSON.stringify(input.activity)}`,
    );

    const domain = process.env.DOMAIN;
    const protocol = process.env.PROTOCOL;
    const port = process.env.PORT;

    if (!domain || !protocol || !port) {
      throw new ConfigurationError(
        "DOMAIN, PROTOCOL, and PORT must be configured",
      );
    }

    const host = port === "80" || port === "443" ? domain : `${domain}:${port}`;

    const event = new ActivityReceivedEvent({
      username: input.username,
      activity: input.activity,
      host,
      protocol,
    });

    this.eventBus.emit(event);
    console.log(`[DispatchS2SActivityEvent] Event emitted successfully`);
  }
}

