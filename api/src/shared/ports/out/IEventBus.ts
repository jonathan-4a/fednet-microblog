// src/shared/ports/out/IEventBus.ts

import type { IEvent } from "../../domain/events";

export type EventHandler<TEvent extends IEvent = IEvent> = (
  event: TEvent,
) => Promise<void> | void;

export interface IEventBus {
  emit<TEvent extends IEvent>(event: TEvent): void;
  emitAndAwait<TEvent extends IEvent>(event: TEvent): Promise<void>;
  on<TEvent extends IEvent>(
    eventName: string,
    handler: EventHandler<TEvent>,
  ): void;
  off<TEvent extends IEvent>(
    eventName: string,
    handler: EventHandler<TEvent>,
  ): void;
}
