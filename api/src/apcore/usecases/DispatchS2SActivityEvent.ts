// src/apcore/usecases/DispatchS2SActivityEvent.ts

import type { IEventBus } from "@shared";
import { ActivityReceivedEvent } from "../domain/events";
import type { DispatchS2SActivityEventInput } from "../ports/in/ActivityPub.dto";
import type { IDispatchS2SActivityEvent } from "../ports/in/IDispatchS2SActivityEvent";

export class DispatchS2SActivityEvent implements IDispatchS2SActivityEvent {
  constructor(
    private readonly eventBus: IEventBus,
    private readonly host: string,
    private readonly protocol: string,
  ) {}

  execute(input: DispatchS2SActivityEventInput): void {
    const activityType =
      typeof input.activity?.type === "string"
        ? input.activity.type
        : JSON.stringify(input.activity?.type);

    console.log(
      `[DispatchS2SActivityEvent] Received inbox activity for ${input.username}: type=${activityType ?? "unknown"}, activity=${JSON.stringify(input.activity)}`,
    );
    const event = new ActivityReceivedEvent({
      username: input.username,
      activity: input.activity,
      host: this.host,
      protocol: this.protocol,
    });

    this.eventBus.emit(event);
    console.log(`[DispatchS2SActivityEvent] Event emitted successfully`);
  }

  async executeAndAwait(input: DispatchS2SActivityEventInput): Promise<void> {
    const activityType =
      typeof input.activity?.type === "string"
        ? input.activity.type
        : JSON.stringify(input.activity?.type);

    console.log(
      `[DispatchS2SActivityEvent] Received inbox activity for ${input.username}: type=${activityType ?? "unknown"}`,
    );
    const event = new ActivityReceivedEvent({
      username: input.username,
      activity: input.activity,
      host: this.host,
      protocol: this.protocol,
    });

    await this.eventBus.emitAndAwait(event);
    console.log(`[DispatchS2SActivityEvent] Event processed successfully`);
  }
}
