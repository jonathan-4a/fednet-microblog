// src/shared/domain/events/IEventHandler.ts

import type { IEvent } from "./IEvent";

export interface IEventHandler<TEvent extends IEvent = IEvent> {
  handle(event: TEvent): Promise<void> | void;
}

