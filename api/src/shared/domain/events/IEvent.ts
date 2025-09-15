// src/shared/domain/events/IEvent.ts

export interface IEvent<TPayload = unknown> {
  readonly id: string;
  readonly name: string;
  readonly payload: TPayload;
  readonly occurredAt: Date;
}

