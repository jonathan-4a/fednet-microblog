// src/apcore/usecases/DispatchC2SActivityEvent.ts

import type { IEventBus } from "@shared";
import { C2SActivitySubmittedEvent } from "../domain/events";
import { ConfigurationError } from "../domain/ActivityPubErrors";
import type { DispatchC2SActivityEventInput } from "../ports/in/ActivityPub.dto";
import type { IDispatchC2SActivityEvent } from "../ports/in/IDispatchC2SActivityEvent";

export class DispatchC2SActivityEvent implements IDispatchC2SActivityEvent {
  constructor(private readonly eventBus: IEventBus) {}

  execute(input: DispatchC2SActivityEventInput): void {
    const activityType =
      typeof input.activity?.type === "string"
        ? input.activity.type
        : JSON.stringify(input.activity?.type);

    console.log(
      `Outbox activity submitted by ${input.username}: ${activityType ?? "unknown"}`,
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

    const event = new C2SActivitySubmittedEvent({
      username: input.username,
      activity: input.activity,
      host,
      protocol,
      responseCallback: input.responseCallback,
    });

    this.eventBus.emit(event);
  }
}

