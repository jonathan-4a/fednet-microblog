// src/shared/domain/events/BaseEvent.ts

import { IEvent } from "./IEvent";

export abstract class BaseEvent<
  TPayload = unknown,
> implements IEvent<TPayload> {
  readonly id: string;
  readonly name: string;
  readonly payload: TPayload;
  readonly occurredAt: Date;

  protected constructor(
    name: string,
    payload: TPayload,
    occurredAt = new Date(),
  ) {
    this.id = crypto.randomUUID();
    this.name = name;
    this.payload = payload;
    this.occurredAt = occurredAt;
  }
}
