// src/apcore/usecases/DispatchC2SActivityEvent.ts

import type { IEventBus } from "@shared";
import { C2SActivitySubmittedEvent } from "../domain/events";
import type { DispatchC2SActivityEventInput } from "../ports/in/ActivityPub.dto";
import type { IDispatchC2SActivityEvent } from "../ports/in/IDispatchC2SActivityEvent";

export class DispatchC2SActivityEvent implements IDispatchC2SActivityEvent {
  constructor(
    private readonly eventBus: IEventBus,
    private readonly host: string,
    private readonly protocol: string,
  ) {}

  execute(input: DispatchC2SActivityEventInput): void {
    const activityType =
      typeof input.activity?.type === "string"
        ? input.activity.type
        : JSON.stringify(input.activity?.type);

    console.log(
      `Outbox activity submitted by ${input.username}: ${activityType ?? "unknown"}`,
    );
    const event = new C2SActivitySubmittedEvent({
      username: input.username,
      activity: input.activity,
      host: this.host,
      protocol: this.protocol,
      responseCallback: input.responseCallback,
    });

    this.eventBus.emit(event);
  }

  async executeAndAwait(input: DispatchC2SActivityEventInput): Promise<void> {
    const activityType =
      typeof input.activity?.type === "string"
        ? input.activity.type
        : JSON.stringify(input.activity?.type);

    console.log(
      `Outbox activity submitted by ${input.username}: ${activityType ?? "unknown"} (awaiting)`,
    );
    const event = new C2SActivitySubmittedEvent({
      username: input.username,
      activity: input.activity,
      host: this.host,
      protocol: this.protocol,
      responseCallback: input.responseCallback,
    });

    await this.eventBus.emitAndAwait(event);
  }
}
