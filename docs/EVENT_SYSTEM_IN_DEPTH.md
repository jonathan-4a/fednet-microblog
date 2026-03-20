# The Event System In Depth: How It Works

This document describes exactly how the current event system works: whether there is a queue, how the emitter and handlers communicate, and how it differs from a job queue. It is long and complete so you can see the full picture.

---

## 1. Short answers to your questions

- **Does your app have a queue for events?**  
  **No.** There is no separate queue (no Redis, no database table, no job queue). Events are not stored in a FIFO queue that you own. The only “queue” involved is the **Node/Bun event loop’s own internal queue** for the `setImmediate` (check) phase. When you call `emit()`, you schedule a callback with `setImmediate`; that callback runs later, in order with other callbacks, but the event payload is only kept in a **closure**, not in a queue data structure.

- **Is it just firing them async immediately in parallel as they come?**  
  **Almost.** For `emit()`: each event schedules **one** `setImmediate` callback. When that callback runs, it **synchronously** invokes the registered handler(s). The handler is async (returns a Promise); the bus does **not** await it (`void wrappedHandler(event)`), so the handler’s work runs “in parallel” with other work on the same event loop (many Promises in flight). So yes: events are “fired” and their handlers are **started** as the callbacks run; they are not serialized through a separate queue, and there is no separate worker process.

- **How does the emitter and handler communicate?**  
  **By direct function call in the same process.** The bus uses a single Node.js `EventEmitter` instance. Handlers are registered with `.on(eventName, listener)`. When `emit()` is used, a `setImmediate` callback runs later and calls `this.emitter.emit(event.name, event)`. The `EventEmitter` then **synchronously** calls every listener registered for that event name, passing the event object. So communication is: same process, in-memory, synchronous invocation of listener functions when the time comes. No network, no queue, no shared storage.

- **Isn’t a queue the same thing as an event bus?**  
  **No.** In this codebase, the “event bus” is **in-memory pub/sub**: publishers call `emit(event)` and subscribers (handlers) are plain functions registered with `.on()`. Delivery is either immediate (in `emitAndAwait`) or deferred to the next check phase (in `emit` via `setImmediate`). A **queue** in the usual sense is a **FIFO store** (often persistent or in a separate service like Redis/SQS) that **producers push to** and **consumers pull from**; there can be many consumers (workers) and the queue survives process restarts. Here, nothing is pushed to or pulled from such a store; there is a single process and no separate consumers. So: same machine, same process, no queue — just an event bus implemented with `EventEmitter` and `setImmediate`.

---

## 2. Components of the event system

### 2.1 The event bus implementation

**File:** `api/src/shared/adapters/events/EventBus.ts`

The bus is a thin wrapper around Node’s built-in **EventEmitter** (from the `events` module).

- **Single emitter:** One private `EventEmitter` instance (`this.emitter`). All event names (e.g. `"post.created"`, `"activity.c2s.submitted"`, `"activity.received"`) are channels on this one emitter.
- **Handler storage:** For each event name, the bus keeps a `Map` of your handler function → a **wrapped** listener and a **promiseHandler**. The wrapped listener is what is actually registered with `this.emitter.on(eventName, emitterListener)`. So when the emitter “fires”, it calls `emitterListener(event)`; that in turn calls your handler (via `wrappedHandler`) and ignores its Promise (`void wrappedHandler(event)`).
- **Two delivery modes:** `emit()` (fire-and-forget) and `emitAndAwait()` (run handlers and wait). They behave very differently; see below.

There is **no** array or list of “pending events”. Events are not stored. They are either delivered immediately (emitAndAwait) or their delivery is deferred by scheduling a single callback (emit).

### 2.2 Event objects

**Files:** `api/src/shared/domain/events/IEvent.ts`, `BaseEvent.ts`, and concrete events under `api/src/.../domain/events/`.

An event is a plain object that implements `IEvent`: it has `id`, `name`, `payload`, `occurredAt`. The **payload** carries the data (e.g. username, activity, actorUrl). When you call `emit(event)` or `emitAndAwait(event)`, that object is passed by reference to the handlers. Nothing is serialized or persisted; it’s all in-memory.

### 2.3 Who registers handlers

**File:** `api/src/composition-root.ts` (lines 296–298)

At startup, three handlers are registered:

- `eventBus.on("post.created", onPostCreated);`
- `eventBus.on("activity.c2s.submitted", onC2SActivitySubmitted);`
- `eventBus.on("activity.received", onActivityReceived);`

So there is **exactly one** listener per event name. Each of these “listeners” is a function that then calls several use-case handlers (e.g. `onC2SActivitySubmitted` runs HandleC2SFollow, HandleC2SCreate, HandleC2SAnnounce, HandleC2SLike in sequence with `await`). The emitter doesn’t know that; it just calls the one registered function per event.

---

## 3. How `emit()` works (fire-and-forget) — step by step

This is the path used for **standalone Create** on the outbox (and for any code that calls `eventBus.emit(...)`).

### 3.1 Call site

Someone (e.g. the outbox controller) calls:

```ts
this.dispatchC2SActivityEvent.execute({ username, activity });
```

That calls `eventBus.emit(C2SActivitySubmittedEvent)` and returns immediately. The controller then does `return c.json({ status: "accepted" }, 202)`.

### 3.2 Inside `EventBus.emit()` (EventBus.ts lines 26–44)

1. **Logging:** The bus logs that it is emitting the event (e.g. `[EventBus] Emitting "activity.c2s.submitted"`).
2. **Schedule, don’t run:** It calls `setImmediate(() => { ... })`. So it passes a **callback** to the runtime. It does **not** call `this.emitter.emit(...)` right now. The callback **closes over** the current `event` object (and `this`), so the event is kept in memory until the callback runs.
3. **Return:** `emit()` returns `true` immediately. So the caller (e.g. the HTTP handler) continues and sends the 202 response. No handler has run yet.

So at this point: **no handler has been invoked**. The only thing that happened is: “run this function later” was added to the event loop’s **check phase** queue. That is the only “queue” involved: the runtime’s internal queue for `setImmediate` callbacks. Your app does not maintain its own queue of events.

### 3.3 When the callback runs (later, same process)

When the Node/Bun event loop reaches the **check** phase, it runs the callback we passed to `setImmediate`. Order is FIFO: if you emitted 100 events, you scheduled 100 callbacks, and they run one after another (unless other check-phase callbacks were scheduled by others).

Inside the callback:

1. **Deliver:** It calls `this.emitter.emit(event.name, event)`. So for example `this.emitter.emit("activity.c2s.submitted", event)`.
2. **What `EventEmitter.emit` does:** The Node `EventEmitter` keeps a list of listeners per event name. It **synchronously** iterates that list and calls each listener with the event: `listener(event)`. So your registered listener (the wrapped `onC2SActivitySubmitted`) is **called right now**, in the same call stack. There is no additional queue: emit means “call every listener now”.

### 3.4 What the listener does (composition-root and EventBus wiring)

The listener that was registered is **not** `onC2SActivitySubmitted` directly. When you called `eventBus.on("activity.c2s.submitted", onC2SActivitySubmitted)`, the bus did (EventBus.ts 59–96):

- **Wrapped your handler:** `wrappedHandler(event)` runs `Promise.resolve(onC2SActivitySubmitted(event))`, attaches a `.catch()` for logging, and returns that Promise.
- **Wrapped again for the emitter:** `emitterListener(event) => void wrappedHandler(event)`. So when the emitter calls `emitterListener(event)`, it runs `wrappedHandler(event)` and **ignores the returned Promise** (`void`). So the async work of `onC2SActivitySubmitted` is **started** but **not awaited** by the event bus.

So when `this.emitter.emit("activity.c2s.submitted", event)` runs:

- It **synchronously** calls `emitterListener(event)`.
- That **synchronously** calls `wrappedHandler(event)`, which **synchronously** starts `onC2SActivitySubmitted(event)` and returns a Promise. The bus does not await that Promise.
- So the setImmediate callback returns. The event loop can then run the next callback (e.g. the next emitted event) or run the microtasks/Promises that were just created.

So: **one event → one setImmediate → one synchronous call into the listener → listener starts async work (Promise) and returns; the bus does not wait.** If you emitted 50 events, you get 50 setImmediate callbacks; when they run, each one does one synchronous `emitter.emit` and starts one async chain. All those chains run “in parallel” in the sense of many Promises in flight on the **same** event loop.

### 3.5 No queue of events

Events are **not** put into a queue. Each `emit(event)`:

- Schedules **one** function: “when you can, call `this.emitter.emit(event.name, event)`.”
- The event is held only in the closure of that function. When the function runs, it delivers the event once to all listeners and then the function ends. The event is not stored anywhere after that.

So the “ordering” you get is: the order in which `setImmediate` callbacks run (FIFO for the check phase). That matches the order of `emit()` calls only if nothing else schedules setImmediate in between. There is no application-level queue; it’s “defer this one delivery to the next check phase.”

---

## 4. How `emitAndAwait()` works (blocking) — step by step

This is the path used for **inbox** and for **outbox** when the activity is Follow/Undo/Like/Announce or Create with `inReplyTo`.

### 4.1 Call site

Example: inbox controller calls:

```ts
await this.dispatchS2SActivityEvent.executeAndAwait({ username, activity });
return c.json({ status: "accepted" }, 202);
```

So the response is sent only **after** `executeAndAwait` resolves.

### 4.2 Inside `EventBus.emitAndAwait()` (EventBus.ts lines 46–57)

1. **Logging:** Same as emit.
2. **Get handlers:** It looks up the event name in `this.wrappedHandlers` and gets the list of **promiseHandler** functions (one per handler you registered with `.on()`). For our setup there is one handler per event name, so one promiseHandler.
3. **Run and wait:** It does `await Promise.all(promiseHandlers.map((h) => h(event)))`. So it **invokes** each promiseHandler with the event **right now** (synchronously starts them), and waits until **all** returned Promises resolve.
4. **Return:** When all handlers have finished, `emitAndAwait` returns. Then the controller sends the response.

Important: **no `setImmediate`.** The handlers run in the **current** tick. So the HTTP request is blocked until all handlers complete. There is no deferral and no use of the event loop’s check queue for delivery; it’s “call handlers now and wait.”

### 4.3 How the handler is run

The `promiseHandler` is the same `wrappedHandler` we saw: it runs your async handler (e.g. `onActivityReceived(event)`) and returns a Promise. So `Promise.all` waits for that Promise. In our case, `onActivityReceived` does:

```ts
await handleS2SFollow.handle(event);
await handleS2SCreate.handle(event);
await handleS2SAnnounce.handle(event);
await handleS2SLike.handle(event);
```

So all four run in sequence, and the response is sent only after the last one finishes. Again: same process, same request, no queue — just direct async/await.

---

## 5. How emitter and handler “communicate”

- **Registration:** At startup, `eventBus.on("activity.c2s.submitted", onC2SActivitySubmitted)` stores a **reference** to a wrapper that eventually calls `onC2SActivitySubmitted`. The EventEmitter keeps this in an internal array keyed by event name.
- **Emit (fire-and-forget):** Later, when the setImmediate callback runs, it calls `this.emitter.emit("activity.c2s.submitted", event)`. The EventEmitter looks up the listeners for that name and **calls each listener with the event**: `listener(event)`. So the “message” is the **event object** (same process, by reference). No network, no serialization, no queue — just a function call with an argument.
- **EmitAndAwait:** Same idea, but the bus doesn’t use the emitter for delivery; it gets the same handlers from `wrappedHandlers` and calls them with the event, then awaits their Promises.

So “communication” is: **passing an object (the event) into a function (the handler) in the same process.** The “bus” is only a dispatcher: it decides **when** to call (now vs next tick) and **whether** to wait (emitAndAwait vs emit).

---

## 6. Event flow for “post.created”

`post.created` is emitted from **CreatePost** (posts use case), which is called from **HandleC2SCreate** when processing an outbox Create activity.

- **Where:** `api/src/posts/usecases/CreatePost.ts` line 78: `this.eventBus.emit(postCreatedEvent);`  
  This is inside `createPost.execute()`, after `await this.postRepository.create(...)`.
- **How:** Same as above: `emit()` schedules a `setImmediate` that will run `this.emitter.emit("post.created", postCreatedEvent)`. So the **post.created** handler runs in a **later** tick. It is **not** awaited by CreatePost; CreatePost returns after emitting.
- **Handler:** The only listener is `onPostCreated` → `handlePostCreated.handle(event)` (fan-out: getFollowers, then sendToInbox for each follower). So again: one setImmediate per post.created, same process, handler started but not awaited by the bus.

So you get a **chain**: outbox request → emit activity.c2s.submitted (setImmediate) → later: HandleC2SCreate runs → createPost.execute() → emit post.created (another setImmediate) → later: HandlePostCreated runs (fan-out). All on the same process and same event loop; no queue between steps.

---

## 7. Queue vs event bus (in this codebase)

- **Event bus here:**
  - **Storage:** No storage. Events are either delivered immediately (emitAndAwait) or their delivery is deferred by one `setImmediate` per emit. The event lives only in a closure until the callback runs.
  - **Consumers:** The same process that emitted: the handlers run in that process. No separate worker processes.
  - **Ordering:** For emit(), order is “when setImmediate callbacks run” (FIFO for the check phase), not a dedicated app-level FIFO queue.
  - **Failure/retry:** If a handler throws, the bus logs it (wrappedHandler’s .catch). There is no retry and no dead-letter queue; the event is already “consumed” (the function was called).

- **A typical job queue (e.g. Redis/BullMQ, SQS):**
  - **Storage:** Jobs are stored (in Redis, DB, or a cloud queue). They survive process restarts.
  - **Consumers:** One or more worker processes (or threads) **pull** jobs from the queue. Producers and consumers can be different processes or machines.
  - **Ordering:** Usually FIFO per queue (or per partition).
  - **Failure/retry:** Jobs can be retried, moved to a dead-letter queue, etc.

So in this app: **there is no queue**. The event system is an **in-memory event bus** that either calls handlers immediately and waits (emitAndAwait) or schedules their invocation for the next check phase (emit) without waiting. Both are same-process, in-memory, no separate queue or workers.

---

## 8. Summary diagram (same process)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  HTTP request (e.g. POST outbox, standalone Create)                        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  eventBus.emit(C2SActivitySubmittedEvent)                              │
│  → setImmediate(() => emitter.emit("activity.c2s.submitted", event))     │
│  → return true immediately                                              │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
         Response 202 sent              Event loop (later): check phase
         to client immediately          runs setImmediate callback
                                                    │
                                                    ▼
                                    emitter.emit(name, event)
                                    → synchronously call listener(s)
                                                    │
                                                    ▼
                                    onC2SActivitySubmitted(event) started
                                    (Promise not awaited by bus)
                                    → HandleC2SCreate.handle(event)
                                       → await createPost.execute()
                                       → eventBus.emit(post.created)
                                          → another setImmediate
                                                    │
                                    … later tick: post.created delivered
                                    → HandlePostCreated.handle(event)
                                       → getFollowers, sendToInbox(...)
```

Everything above happens in **one process**. The only “queue” is the runtime’s setImmediate (check) queue; there is no application-level event queue and no separate worker.

---

## 9. Files reference

- **Event bus:** `api/src/shared/adapters/events/EventBus.ts`
- **Interface:** `api/src/shared/ports/out/IEventBus.ts`
- **Event shape:** `api/src/shared/domain/events/IEvent.ts`, `BaseEvent.ts`
- **Handler registration:** `api/src/composition-root.ts` (onPostCreated, onC2SActivitySubmitted, onActivityReceived; and eventBus.on(...))
- **Emit call sites:** e.g. DispatchC2SActivityEvent (execute → emit), DispatchS2SActivityEvent (executeAndAwait → emitAndAwait), CreatePost (emit post.created)
- **Controllers:** `api/src/apcore/adapters/http/ActivityPubController.ts` (postOutbox, postInbox)

This is the full picture of how the current event system works and why it is not a queue.
