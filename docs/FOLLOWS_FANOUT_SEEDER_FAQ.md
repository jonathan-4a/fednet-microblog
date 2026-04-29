# Follow handling, fan-out, seeder, and timeouts — detailed Q&A

This document answers specific questions about HandleC2SFollow, HandleS2SFollow, sendToInbox, the follow graph in the load test, what the seeder does, where timeouts occur, and whether HTTP timeouts are configured. All answers are based on the current codebase.

---

## 1. What does HandleC2SFollow actually do? Does it deliver to the remote inbox only, or also write to the local DB?

**File:** `api/src/apcore/handlers/HandleC2SFollowActivity.ts`

HandleC2SFollow runs when a **local user** submits a Follow (or Undo) activity from the outbox (client-to-server). It does **both**: deliver to the remote inbox **and** write to the local DB when the target is remote.

### For a Follow activity (lines 31–54)

1. **Resolve target actor:** `activity.object` is the followed actor (the person being followed). It is either a string (actor URL) or an object with `id`; the code takes the string or `object.id`.
2. **Deliver to remote inbox:**  
   `await this.federationDelivery.sendToInbox(targetActor, activity);`  
   So the Follow activity is **always** sent to the target actor’s inbox (local or remote). That is the federation delivery step.
3. **Write to local DB (only if target is remote):**  
   If `!targetActor.startsWith(this.ourOrigin)` (target is on another instance), it then does:  
   `await this.followRepository.upsertFollow(followerActor, targetActor, "accepted");`  
   So the local DB gets a follow record: **follower** = our user (actor), **followed** = target actor, **status** = `"accepted"`. There is no “pending” state here; the local side records it as accepted immediately after sending the Follow to the remote inbox.
4. **Notification (optional):** If `this.notify` is set, it calls `await this.notify.onFollowDone(targetActor, followerActor)` (e.g. for notifications).

So: **it delivers the Follow to the target’s inbox and, when the target is remote, also writes a local DB row** (follower, followed, status `"accepted"`). It does **not** write a “pending” follow and wait for an Accept; it writes `"accepted"` right after sending.

### For an Undo activity (lines 55–84)

It sends the Undo to the target’s inbox and then **deletes** the local follow record:  
`await this.followRepository.deleteFollow(followerActor, targetActor);`

---

## 2. What does HandleS2SFollow do on the receiving inbox side? Does it auto-accept the follow, or wait for an Accept activity back?

**File:** `api/src/apcore/handlers/HandleS2SFollowActivity.ts`

HandleS2SFollow runs when **our** instance receives an activity in a user’s **inbox** (server-to-server), i.e. someone else (possibly on another instance) is following our user.

### For a Follow activity (lines 22–42)

1. **Resolve actors:**  
   `followerActor` = who is following (from `activity.actor`).  
   `followedActor` = our user whose inbox received the activity (`${protocol}://${host}/u/${username}`).
2. **Write to local DB:**  
   `await this.followRepository.upsertFollow(followerActor, followedActor, "accepted");`  
   So it **immediately** records the follow as **accepted** in the local DB. There is no “pending” state and no wait for a separate Accept activity.
3. **Notification:** If the follower is remote and `this.notify` is set, it calls `await this.notify.onFollowDone(followedActor, followerActor)`.

So on the **receiving** side: **follows are auto-accepted**. The handler does **not** wait for or look for an Accept activity; it just upserts the follow with status `"accepted"`. The protocol could later be extended to support “pending” and sending Accept, but the current code does not do that.

### For an Undo { Follow } (lines 45–67)

It deletes the follow:  
`await this.followRepository.deleteFollow(followerActor, followedActor);`

---

## 3. How does sendToInbox work? One HTTP call per follower sequentially, or all concurrently with Promise.all?

**Fan-out (who calls sendToInbox for many followers):**  
**File:** `api/src/apcore/usecases/FanOutActivity.ts`

- It gets the list of followers: `const followers = await this.followRepository.getFollowers(actorUrl);` and builds `allTargets` (followers plus optional inReplyTo target).
- It then does:
  ```ts
  const deliveryPromises = allTargets.map(async (targetActor) => {
    try {
      await this.federationDelivery.sendToInbox(targetActor, activity);
      // ...
    } catch (error) { /* log */ }
  });
  await Promise.allSettled(deliveryPromises);
  ```
  So it **starts one Promise per target** (each doing one `sendToInbox`). It does **not** await them one by one; it **fires all of them concurrently** and then waits for all to settle with `Promise.allSettled`. So: **concurrent** delivery, not sequential.

**Actual HTTP in sendToInbox:**  
**File:** `api/src/apcore/adapters/http/FederationDelivery.ts`

- `sendToInbox(targetActor, activity)`:
  1. Resolves the target’s inbox URL: `await this.discoverInbox(targetActor)` (one GET to the actor URL to read `inbox`).
  2. Signs the request and sends: `await this.signAndSend(...)` (one POST to that inbox URL).
- So **one** inbox delivery = **two** HTTP calls (GET actor, POST inbox). Per follower, both are awaited inside that follower’s Promise; across followers, all those Promises run concurrently.

**Summary:** Fan-out does **one concurrent “branch” per follower** (each branch: discoverInbox + signAndSend). So it’s **concurrent**, not sequential; the wait is `Promise.allSettled` over all of them.

---

## 4. What is the follow graph scale in the load test? How many followers does an average user have?

**Config:** `seeder/config.py`

- **NUM_USERS** = 2000  
- **AVG_FOLLOWS** = 16  (average **out-degree**: follows per user)  
- **LOCAL_BIAS** = 0.65  (about 65% of follows are within the same instance, 35% cross-instance)  
- **NUM_INSTANCES** = 15  

**How the graph is built:** `seeder/simulator.py`, class `FollowGraphBuilder`

- For each user, the number of follows is drawn from a **Poisson distribution** with mean **AVG_FOLLOWS** (16), clamped to at least 1 and at most n−1.
- Of that number, about **LOCAL_BIAS** (65%) are to other users on the **same** instance, the rest to users on **other** instances.
- Who is followed is chosen with **Zipf (power-law) weights** (popularity), so some users are followed much more often than others.

So **out-degree** (how many each user follows) has mean ~16 with variance from Poisson. In a directed graph, total edges = sum of out-degrees = 2000 × 16 = 32 000, so **average in-degree (followers per user)** is also **~16**. Because of Zipf popularity, **distribution of followers is skewed**: many users have fewer than 16 followers, and a smaller number have many more (tens or more).

So for **fan-out per post**: when a user with **F** followers creates a post, the server does **F** concurrent `sendToInbox` calls (each: GET actor + POST inbox). So **on average ~16 inbox deliveries per post**, with some users causing many more (e.g. 50–100+) and others fewer.

---

## 5. What is the seeder doing exactly? All posts from one instance, or distributing across all 15 instances simultaneously?

**File:** `seeder/migrator.py`

- The seeder loads a **blueprint** from `network.pkl` (produced by the simulator): users, posts, and follow edges, with each user assigned to an instance (`instance_1` … `instance_15`).
- **Posts** are grouped **by author’s instance**: `by_instance_posts[instance_name]` = list of (post_node_id, post_data, user_data, token) for that instance.
- **Phase 4 (standalone posts)** and **Phase 5 (replies)** are currently **commented out** in the migrator (lines 400–415). When enabled, they look like this:

  **Phase 4 – Standalone posts:**  
  `run_parallel(inject_posts_instance, { name: (name, by_instance_posts[name], node_map, False, args.dry_run) for name in instance_names }, n)`

  So it runs **one task per instance**. Each task is `inject_posts_instance(instance_name, that_instance’s_posts, node_map, replies_only=False, dry_run)`. So **posts are distributed by instance**: instance_1’s posts are sent only to instance_1’s API, instance_2’s to instance_2’s, etc.

- **run_parallel** (lines 304–311): uses a **ThreadPoolExecutor** with `max_workers = min(n, MAX_WORKERS)`. **MAX_WORKERS** = 4 in config. So at most **4** of these tasks run at once. So at any moment, **up to 4 instances** are being sent posts in parallel; when one task finishes, the next instance’s task starts. So it’s **distributed across instances**, but **not** all 15 at once — **4 concurrent instance streams**.
- **Within each instance**, `inject_posts_instance` loops over that instance’s posts **sequentially** and for each calls `post_create(...)`. There is a small throttle: **POST_THROTTLE_SECONDS** = 0.05 between posts (same instance).

**Summary:** The seeder **distributes posts by instance**: each instance’s posts are sent only to that instance’s API. It runs **up to 4 instances in parallel** (not 15 at once). Within each instance, posts are sent **one after another** with a 0.05 s delay between posts.

---

## 6. Are the timeouts on the seeder side (client waiting for 202) or are instances timing out when calling each other’s inboxes?

**Seeder (client) timeouts:**

- **File:** `seeder/migrator.py`  
  - `post_create`: `requests.post(..., timeout=10)` (line 191).  
  - `post_follow`: `requests.post(..., timeout=10)` (line 155).  
  - Register: `timeout=10` (line 106).  
  - Login: `timeout=10` (line 126).  
  So the **seeder** (Python) will **time out** if the server does not respond within **10 seconds**. That is the “client waiting for 202” case: if the API is slow to respond (e.g. overloaded), the seeder gets a timeout.

**Instance-to-instance (sendToInbox) timeouts:**

- **File:** `api/src/apcore/adapters/http/FederationDelivery.ts`  
  - `fetch(actorUrl, ...)` in `discoverInbox` (lines 118–120): **no** `signal` or `timeout` option.  
  - `fetch(inbox, ...)` in `signAndSend` (lines 164–171): **no** `signal` or `timeout` option.  
  - Same for `getAuthorActorFromNote` and `verifyActorExists`: plain `fetch` with no timeout.  
  So **server-side** federation **sendToInbox** (and related fetches) **do not set any HTTP timeout**. They can wait **indefinitely** until the OS or runtime gives up (or the remote closes the connection). So **instance-to-instance** calls do **not** have an explicit timeout in code; if a remote instance is slow or stuck, the caller can hang.

**Summary:**  
- **Timeouts you see when running the seeder** are almost certainly **seeder-side**: the seeder gives the API 10 seconds to respond; if the API doesn’t respond in time (e.g. under load), the seeder raises a timeout.  
- **Instance-to-instance** inbox delivery has **no** configured HTTP timeout, so those calls can hang or take very long without the seeder being involved.

---

## 7. Is there any HTTP timeout configured on sendToInbox calls, or does it wait indefinitely?

**Answer: There is no HTTP timeout configured; it can wait indefinitely.**

**File:** `api/src/apcore/adapters/http/FederationDelivery.ts`

- **discoverInbox:** `fetch(actorUrl, { headers: { Accept: "application/activity+json" } })` — no `signal`, no `timeout`.
- **signAndSend:** `fetch(inbox, { method: "POST", headers: {...}, body: messageBody })` — no `signal`, no `timeout`.

So both the **actor fetch** and the **inbox POST** use the default behavior of `fetch`: they rely on the runtime/OS for any timeout. In Node/Bun there is typically no default timeout, so a slow or unresponsive remote can cause the Promise to hang until the connection fails or is closed. To add a timeout you would use `AbortController` and pass `signal` with a timeout to `fetch`.

---

## Summary table

| Question | Answer |
|----------|--------|
| HandleC2SFollow: only deliver or also DB? | Delivers to target inbox **and** writes local DB when target is remote (`upsertFollow(..., "accepted")`). No “pending” state. |
| HandleS2SFollow: auto-accept or wait for Accept? | **Auto-accept.** Upserts follow with `"accepted"` immediately. No wait for Accept activity. |
| sendToInbox: sequential or concurrent? | **Concurrent:** one Promise per follower, `Promise.allSettled` over all. Each delivery = GET actor + POST inbox. |
| Follow graph: average followers per user? | **~16** (AVG_FOLLOWS=16, 2000 users; Zipf makes distribution skewed). |
| Seeder: one instance or all? | **Distributed by instance;** up to **4 instances in parallel** (MAX_WORKERS=4); within each instance, posts sent sequentially with 0.05 s throttle. |
| Timeouts: seeder or instance-to-instance? | **Seeder** uses 10 s timeout when waiting for API response. **Instance-to-instance** sendToInbox has **no** timeout (can wait indefinitely). |
| HTTP timeout on sendToInbox? | **None.** No AbortController/signal; can wait indefinitely. |

All of the above is taken from the referenced files in the repo.
