// src/shared/adapters/events/EventBus.ts

import { EventEmitter } from "events";
import type { IEvent } from "../../domain/events";
import type { EventHandler, IEventBus } from "../../ports/out/IEventBus";
import type { ILogger } from "../../ports/out/ILogger";

export class EventBus implements IEventBus {
  private readonly emitter = new EventEmitter();

  private readonly wrappedHandlers = new Map<
    string,
    Map<
      EventHandler<IEvent>,
      {
        listener: (event: IEvent) => void;
        promiseHandler: (event: IEvent) => Promise<void>;
      }
    >
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

  async emitAndAwait<TEvent extends IEvent>(event: TEvent): Promise<void> {
    this.logger.info(`[EventBus] Emitting (await) "${event.name}"`, {
      id: event.id,
      occurredAt: event.occurredAt,
    });

    const handlersForEvent = this.wrappedHandlers.get(event.name);
    const promiseHandlers = handlersForEvent
      ? [...handlersForEvent.values()].map((entry) => entry.promiseHandler)
      : [];
    await Promise.all(promiseHandlers.map((h) => h(event)));
  }

  on<TEvent extends IEvent>(
    eventName: string,
    handler: EventHandler<TEvent>,
  ): this {
    const wrappedHandler = (event: TEvent): Promise<void> => {
      const p = Promise.resolve(handler(event));
      p.catch((error) => {
        const err = error instanceof Error ? error : new Error(String(error));
        this.logger.error(
          `[EventBus] Handler failed for "${eventName}"`,
          err.stack,
        );
      });
      return p;
    };

    const emitterListener = (event: TEvent): void => {
      void wrappedHandler(event);
    };

    const handlersForEvent =
      this.wrappedHandlers.get(eventName) ??
      new Map<
        EventHandler<IEvent>,
        {
          listener: (event: IEvent) => void;
          promiseHandler: (event: IEvent) => Promise<void>;
        }
      >();

    handlersForEvent.set(handler as EventHandler<IEvent>, {
      listener: emitterListener,
      promiseHandler: wrappedHandler as (event: IEvent) => Promise<void>,
    });
    this.wrappedHandlers.set(eventName, handlersForEvent);

    this.emitter.on(eventName, emitterListener);
    return this;
  }

  off<TEvent extends IEvent>(
    eventName: string,
    handler: EventHandler<TEvent>,
  ): this {
    const handlersForEvent = this.wrappedHandlers.get(eventName);
    const entry = handlersForEvent?.get(handler as EventHandler<IEvent>);

    if (entry) {
      this.emitter.off(eventName, entry.listener);
      handlersForEvent?.delete(handler as EventHandler<IEvent>);

      if (handlersForEvent?.size === 0) {
        this.wrappedHandlers.delete(eventName);
      }
    }

    return this;
  }
}
