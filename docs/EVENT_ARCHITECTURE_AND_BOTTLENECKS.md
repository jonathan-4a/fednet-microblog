# Standalone posts timing out at scale

When the seeder injects a **large number of standalone posts** (Create without `inReplyTo`), the outbox handler returns **202** immediately — it uses `execute()` (fire-and-forget), not `executeAndAwait`. So the timeout is not from blocking on remote delivery; it’s from **load** on the server.

## Likely causes

1. **SQLite contention**  
   Single SQLite DB. Every outbox POST does a **DB read** in auth (token blacklist check). Each post then schedules work that does **DB write** (createPost) and **DB read** (getFollowers for fan-out). With many concurrent POSTs (multiple instances × many posts), SQLite’s single-writer behavior can block reads during writes and vice versa, so even the “quick” path (auth + return 202) can stall waiting on the DB.

2. **Event loop saturation**  
   Each POST schedules `setImmediate(activity.c2s.submitted)` → CreatePost (DB) → `post.created` → HandlePostCreated (getFollowers + N× sendToInbox). With many posts, the loop is full of these handlers and I/O. New requests (auth, parse body, return 202) get delayed because the loop is busy, so the seeder sees timeouts.

3. **No backpressure**  
   All outbox POSTs are accepted and all work is queued in the same process and DB. There’s no limit on concurrent handlers or fan-out, so under heavy load the server can become slow to respond.

## Things to try (short term)

- **Reduce concurrency**: Throttle the seeder so the server isn’t flooded.
- **Observe**: Add logging or metrics around auth duration, DB time, and event-loop delay to confirm the bottleneck.

---

# Architectural changes to scale to millions of requests

To remove the bottlenecks and let servers process millions of requests, you need to **decouple accepting requests from doing work** and **scale each part independently**. Below is the target architecture and the main changes.

## 1. Thin request path: accept → enqueue → 202

**Idea:** The HTTP server should do the minimum: validate, optionally write a “job” or “event” somewhere, then return **202 Accepted**. It should **not** run CreatePost, fan-out, or inbox processing on the same process/event loop.

**Today:** Outbox returns 202 but still runs CreatePost and fan-out in the same process via `setImmediate`. Inbox uses `executeAndAwait` and blocks until all handlers finish.

**Target:**

- **Outbox (client POST Create):** Validate + auth, then either:
  - Write “outbox activity received” to a **job queue** (e.g. “process-outbox-activity”), return 202; a **worker** runs CreatePost and emits “post created”, or
  - Write directly to a “pending activities” table and return 202; a worker consumes that table and does CreatePost + fan-out.
- **Inbox (federation POST):** Validate signature, write the activity to a **queue** or “inbox pending” store, return **202** immediately. A worker consumes and runs the current S2S handlers (Follow, Create, Announce, Like).

Result: request path is “validate → enqueue → 202”. No heavy DB or fan-out on the request path, so one process can handle many more requests per second.

## 2. Job queue + workers

**Idea:** Move all “work” (create post, fan-out, inbox processing) into **jobs** consumed by **worker processes**. The API process only enqueues jobs.

**Components:**

- **Queue:** Redis + BullMQ, or SQS, or RabbitMQ, or Kafka, etc. Needs to be shared across API and workers.
- **Queues (examples):**
  - `outbox-activity` – payload: { username, activity }. Worker: run CreatePost, then enqueue “post-created” or trigger fan-out.
  - `post-created` – payload: { actorUrl, activity }. Worker: getFollowers, then for each follower enqueue `deliver-inbox` or do sendToInbox in batches.
  - `inbox-activity` – payload: { username, activity }. Worker: run HandleS2SFollow, HandleS2SCreate, HandleS2SAnnounce, HandleS2SLike (current logic, in worker).
  - Optionally `deliver-inbox` – one job per (targetActor, activity) so delivery is parallelized and retried per recipient.

**Scaling:** Run more worker processes (or more worker threads) as load grows. The API stays stateless and only enqueues; workers do DB writes and HTTP federation.

## 3. Database: move off SQLite

**Idea:** SQLite is single-writer and not suitable for millions of concurrent reads/writes from multiple processes.

**Target:**

- **Primary store:** PostgreSQL (or MySQL, etc.) with a **connection pool** (e.g. PgBouncer or app-level pool). All API instances and workers connect to the same DB.
- **Optional:** Read replicas for read-heavy use cases (feeds, getFollowers, etc.) so reads don’t contend with writes.

This removes SQLite contention and allows many concurrent connections and higher throughput.

## 4. Stateless API + horizontal scaling

**Idea:** Run **multiple API instances** behind a load balancer. No in-memory state; anything that must be shared (sessions, tokens, queue) lives in shared storage.

**Needed:**

- **Stateless API:** No in-process event bus that “does work”. Only: auth (DB or Redis lookup), enqueue job, return 202/200. Auth can use JWT + DB/Redis for token blacklist and credentials.
- **Shared DB:** PostgreSQL (or similar) used by all API instances and workers.
- **Shared queue:** Redis/SQS/etc. used by all API instances to enqueue and by workers to consume.
- **Load balancer:** Round-robin or least-connections to API instances.

Then you scale by adding more API instances and more workers; the DB and queue become the next bottlenecks to tune (connection pooling, read replicas, queue partitioning).

## 5. Federation delivery

**Idea:** Don’t do fan-out inside the request path or in a single event handler that blocks others. Fan-out should be done in workers, with optional parallelism and retries per recipient.

**Target:**

- “Post created” triggers a job (or one job per follower) to deliver to each inbox.
- Workers run `sendToInbox`. You can limit concurrency per worker (e.g. 10 concurrent fetch) and use queue retries with backoff for failed deliveries.
- Optionally: batch or priority queues so inbox delivery doesn’t starve other job types.

## Summary: before vs after

| Aspect | Current | Target (millions of requests) |
|--------|--------|--------------------------------|
| Request path | Outbox: 202 then in-process work. Inbox: block until handlers done. | Accept → enqueue → 202 for both outbox and inbox. |
| Where work runs | Same process (setImmediate + handlers). | Dedicated workers consuming from a queue. |
| DB | Single SQLite. | PostgreSQL (or similar) + pool; optional read replicas. |
| Scaling | Single process. | Multiple API instances + multiple workers; queue + DB shared. |
| Federation | In-process after CreatePost. | Jobs in queue; workers do sendToInbox with concurrency limits and retries. |

## Phasing

1. **Phase 1 – Queue + workers (single node):** Introduce a job queue and one worker process. Outbox and inbox enqueue jobs and return 202; worker runs current handler logic. Keep SQLite if needed. This already decouples the request path from heavy work.
2. **Phase 2 – DB:** Migrate to PostgreSQL (or similar) and connection pooling so multiple workers and future API instances can share the DB.
3. **Phase 3 – Scale out:** Multiple API instances behind a load balancer, multiple workers, shared queue and DB. Tune pool sizes, replicas, and queue concurrency.
4. **Phase 4 – Optional:** Separate queues or workers for “inbox” vs “fan-out”, read replicas for feeds, and per-recipient delivery jobs with retries.
