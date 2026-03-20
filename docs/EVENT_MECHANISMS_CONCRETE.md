# Event mechanisms per endpoint (concrete, from the code)

This document describes exactly what the code does for each endpoint that uses events: whether the response is sent before or after work, whether work is queued or run in-process, and what causes the bottleneck.

---

## 1. EventBus: two modes (no queue)

**File:** `api/src/shared/adapters/events/EventBus.ts`

There is **no external queue** (no Redis, no job table). The bus is an in-process `EventEmitter` with two ways to deliver:

### `emit(event)` (fire-and-forget)

- **Code:** Lines 26–44. Calls `setImmediate(() => { this.emitter.emit(event.name, event); })` then returns `true` immediately.
- **Meaning:** The actual handlers run in a **later tick of the same event loop**, in the **same process**. Nothing is persisted; it’s “run this callback later” on the same Node/Bun process.
- **Response:** Whatever called `emit()` can return the HTTP response **before** the handlers run. The response is **not** waiting on the work.

### `emitAndAwait(event)` (blocking)

- **Code:** Lines 46–57. Gets handlers for the event name and runs `await Promise.all(promiseHandlers.map((h) => h(event)))`. No `setImmediate`.
- **Meaning:** Handlers run **now**, and the caller waits until **all** of them finish. Still same process, same event loop.
- **Response:** The HTTP response is sent **after** all handlers complete.

So: **current “event” handling is either “defer with setImmediate” or “run and wait”; there is no separate queue or worker process.**

---

## 2. POST `/u/:username/outbox` (client posts an activity)

**File:** `api/src/apcore/adapters/http/ActivityPubController.ts`, `postOutbox` (lines 112–151).

### Branch A: Follow / Undo / Like / Announce, OR Create with `inReplyTo`

- **Condition:** `needsAwait || isCreateWithRemoteReply` is true (lines 131–139).
- **Code path:**  
  `await this.dispatchC2SActivityEvent.executeAndAwait({ username, activity });`  
  then `return c.json({ status: "accepted" }, 200);`
- **Mechanism:** `executeAndAwait` → `eventBus.emitAndAwait(C2SActivitySubmittedEvent)`. So **all** handlers for `activity.c2s.submitted` run **synchronously** (in terms of the request), and the response is sent **after** they finish.
- **Handlers (one listener, composition-root.ts 280–286):**  
  `onC2SActivitySubmitted` runs, in order, with `await`:  
  `handleC2SFollow.handle` → `handleC2SCreate.handle` → `handleC2SAnnounce.handle` → `handleC2SLike.handle`.
- **For a Create with remote reply:** `HandleC2SCreate` does `await federationDelivery.sendToInbox(inReplyToAuthorActor, activity)` then `await createPost.execute(...)`. So the response is sent only after: delivery to the remote inbox **and** local DB write.
- **Summary:** Response **after** all C2S work (and for Create+reply, after remote delivery + createPost). **Blocking.**

### Branch B: Create without `inReplyTo` (standalone), or other types not in `needsAwait`

- **Condition:** Else branch (lines 148–150).
- **Code path:**  
  `this.dispatchC2SActivityEvent.execute({ username, activity });`  
  then `return c.json({ status: "accepted" }, 202);`
- **Mechanism:** `execute()` → `eventBus.emit(C2SActivitySubmittedEvent)`. So `emit()` runs: it schedules `setImmediate(() => emitter.emit("activity.c2s.submitted", event))` and returns. Then the controller returns 202. So the **response is sent before any handler runs**.
- **When does the work run?** On a later event-loop tick, the `setImmediate` callback runs **in the same process**. It calls `emitter.emit("activity.c2s.submitted", event)`, which **synchronously** invokes the registered listener. The listener is `onC2SActivitySubmitted` (composition-root 296). The EventBus wraps it so it is called as `void wrappedHandler(event)` — the handler’s Promise is **not** awaited by the emitter. So:
  - The `setImmediate` callback starts **one** Promise (the four handlers in sequence) and returns.
  - That Promise runs: `handleC2SFollow` → `handleC2SCreate` → `handleC2SAnnounce` → `handleC2SLike`. For a Create, only `HandleC2SCreate` does real work: `await createPost.execute(...)` (DB write), then inside CreatePost, `this.eventBus.emit(postCreatedEvent)` (see below).
- **So for standalone Create:** Response 202 is sent **immediately**. Work is **not** queued to another system; it is **scheduled in the same process** with `setImmediate`. When that runs, one async chain per post runs (DB write + emit `post.created`). So it is **concurrent** in the sense that many such chains can be in flight at once (many Promises), but all run on the **same** event loop and **same** process and **same** SQLite. There is **no** separate queue or worker.

### Where `post.created` fits (outbox standalone Create)

- **Emitted from:** `api/src/posts/usecases/CreatePost.ts` line 78: `this.eventBus.emit(postCreatedEvent)` (inside `createPost.execute()`).
- **When:** After `await this.postRepository.create(...)` (line 45), so after the post is in the DB.
- **How:** `emit()` again → another `setImmediate`. So when that tick runs, the listener `onPostCreated` runs (composition-root 276–278) → `await handlePostCreated.handle(event)` → fan-out: `getFollowers(actorUrl)` (DB read) then `sendToInbox` for each follower (HTTP). Still same process, same event loop.

**End-to-end for one standalone Create:**

1. Request hits `postOutbox` → `execute()` → `emit()` → `setImmediate` scheduled → **202 returned**.
2. Later tick: `setImmediate` runs → emit `activity.c2s.submitted` → listener runs (not awaited by emitter) → `HandleC2SCreate` runs → `await createPost.execute()` (DB write) → CreatePost does `emit(post.created)` → another `setImmediate` scheduled.
3. Later tick: `post.created` setImmediate runs → `HandlePostCreated` → getFollowers (DB) + N× sendToInbox (HTTP).

So: **response first**, then work in the same process. The problem under load: many posts → many `setImmediate` callbacks and many Promises (DB + HTTP) on one event loop and one SQLite, so the server is busy and **new** requests (e.g. next outbox POST) get delayed.

---

## 3. POST `/u/:username/inbox` (federation delivers an activity)

**File:** `api/src/apcore/adapters/http/ActivityPubController.ts`, `postInbox` (lines 70–84).

- **Code path:**  
  `await this.dispatchS2SActivityEvent.executeAndAwait({ username, activity });`  
  then `return c.json({ status: "accepted" }, 202);`
- **Mechanism:** Same idea as outbox branch A. `executeAndAwait` → `eventBus.emitAndAwait(ActivityReceivedEvent)`. So **all** handlers for `activity.received` run and the request **waits** until they finish. Then the response is sent.
- **Handlers (one listener, composition-root 289–293):**  
  `onActivityReceived` runs, in order, with `await`:  
  `handleS2SFollow.handle` → `handleS2SCreate.handle` → `handleS2SAnnounce.handle` → `handleS2SLike.handle`.
- **Summary:** The **response is sent after** all S2S processing (DB, notifications, etc.). The federation **sender** (e.g. another instance doing fan-out) holds the connection until our handlers complete. So inbox is **blocking**: we do **not** “accept and process later”; we process then respond.

---

## 4. Summary table (concrete)

| Endpoint | Activity type | Method used | When is response sent? | Where does work run? |
|----------|----------------|------------|------------------------|-----------------------|
| POST outbox | Follow / Undo / Like / Announce | `executeAndAwait` | **After** all C2S handlers finish | Same request, same process |
| POST outbox | Create with `inReplyTo` | `executeAndAwait` | **After** remote delivery + createPost + other C2S handlers | Same request, same process |
| POST outbox | Create without `inReplyTo` (standalone) | `execute` → `emit()` | **Before** any handler runs (202 immediately) | Same process, later tick(s) via `setImmediate` |
| POST inbox | Any | `executeAndAwait` | **After** all S2S handlers finish | Same request, same process |

---

## 5. What “respond after scheduling” means here

- **Outbox standalone Create:** We **already** respond before doing the work. We do **not** wait for handlers. We call `emit()` (which only schedules `setImmediate`) and then return 202. So we **do** “respond after scheduling” in that sense.
- **Why it still breaks under load:** The “scheduling” is just `setImmediate` in the **same** process. So the work (createPost, getFollowers, sendToInbox) still runs in the **same** process and competes with new requests. With many posts, the event loop is full of that work, so the **next** request (e.g. next POST from the seeder) is delayed — not because we wait for the previous post’s work before responding, but because the **single** process is busy doing that work when the next request arrives.
- **A real “queue” would mean:** Write the job to something **outside** this process (e.g. Redis, DB table, SQS). Return 202. Another **process** (worker) reads from that store and does createPost / fan-out. Then the API process’s event loop is not doing that work, so it can handle millions of “accept and enqueue” operations; the workers scale separately.

---

## 6. What causes the bottleneck (concrete)

1. **POST outbox (standalone Create):** Response is 202 before work. Bottleneck is **event loop saturation** and **SQLite contention**: many `setImmediate` chains (createPost + post.created fan-out) and DB access on one process and one DB.
2. **POST outbox (Create with reply, or Follow/Like/Announce):** Response is **after** work. Bottleneck is **blocking**: we wait for C2S handlers (and for Create+reply, for remote inbox delivery + createPost).
3. **POST inbox:** Response is **after** work. Bottleneck is **blocking**: we wait for all S2S handlers before sending 202, so the sender is blocked and we do all work on the request’s event loop.

No endpoint uses an external queue; everything is either “run and wait” (`emitAndAwait`) or “run later on same process” (`emit` + `setImmediate`).
