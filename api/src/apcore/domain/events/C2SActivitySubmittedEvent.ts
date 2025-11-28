// src/apcore/domain/events/C2SActivitySubmittedEvent.ts

import { BaseEvent } from "@shared";

export interface C2SActivitySubmittedPayload {
  readonly username: string;
  readonly activity: Record<string, unknown>;
  readonly host: string;
  readonly protocol: string;
  readonly responseCallback?: (error?: Error) => void;
}

export class C2SActivitySubmittedEvent extends BaseEvent<C2SActivitySubmittedPayload> {
  constructor(payload: C2SActivitySubmittedPayload) {
    super("activity.c2s.submitted", payload);
  }
}

