// src/shared/adapters/events/EventBus.ts

import { EventEmitter } from "events";
import type { IEvent } from "../../domain/events";
import type { EventHandler, IEventBus } from "../../ports/out/IEventBus";
import type { ILogger } from "../../ports/out/ILogger";

// TODO: has to be singleton
export class EventBus implements IEventBus {
  private readonly emitter = new EventEmitter();

  private readonly wrappedHandlers = new Map<
    string,
    Map<EventHandler<any>, (event: any) => void>
  >();

  constructor(private readonly logger: ILogger) {
    this.emitter.setMaxListeners(100);
  }

  emit<TEvent extends IEvent>(event: TEvent): boolean {
    this.logger.info(`[EventBus] Emitting "${event.name}"`, {
      id: event.id,
      occurredAt: event.occurredAt,
    });

    setImmediate(() => {
      try {
        this.emitter.emit(event.name, event);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        this.logger.error(
          `[EventBus] Critical: Failed to deliver event "${event.name}"`,
          err.stack,
        );
      }
    });

    return true;
  }

  on<TEvent extends IEvent>(
    eventName: string,
    handler: EventHandler<TEvent>,
  ): this {
    const wrappedHandler = (event: TEvent): void => {
      void Promise.resolve(handler(event)).catch((error) => {
        const err = error instanceof Error ? error : new Error(String(error));
        this.logger.error(
          `[EventBus] Handler failed for "${eventName}"`,
          err.stack,
        );
      });
    };

    const handlersForEvent =
      this.wrappedHandlers.get(eventName) ??
      new Map<EventHandler<any>, (event: any) => void>();

    handlersForEvent.set(handler, wrappedHandler);
    this.wrappedHandlers.set(eventName, handlersForEvent);

    this.emitter.on(eventName, wrappedHandler);
    return this;
  }

  off<TEvent extends IEvent>(
    eventName: string,
    handler: EventHandler<TEvent>,
  ): this {
    const handlersForEvent = this.wrappedHandlers.get(eventName);
    const wrappedHandler = handlersForEvent?.get(handler);

    if (wrappedHandler) {
      this.emitter.off(eventName, wrappedHandler);
      handlersForEvent?.delete(handler);

      if (handlersForEvent?.size === 0) {
        this.wrappedHandlers.delete(eventName);
      }
    }

    return this;
  }
}

