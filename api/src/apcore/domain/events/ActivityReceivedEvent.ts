// src/apcore/domain/events/ActivityReceivedEvent.ts

import { BaseEvent } from "@shared";

export interface ActivityReceivedPayload {
  readonly username: string;
  readonly activity: Record<string, unknown>;
  readonly host: string;
  readonly protocol: string;
}

export class ActivityReceivedEvent extends BaseEvent<ActivityReceivedPayload> {
  constructor(payload: ActivityReceivedPayload) {
    super("activity.received", payload);
  }
}

