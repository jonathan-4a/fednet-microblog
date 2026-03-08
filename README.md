# ActivityPub Microblogging

A self-hostable microblogging server with ActivityPub federation support. Single codebase with a Bun/Hono API backed by SQLite and a React SPA.

---

## What it does

- Users can register, post short notes, follow each other, reply, like, and boost (announce) posts.
- The server implements ActivityPub (actors, WebFinger, inbox/outbox, HTTP Signatures), so local users can follow and be followed by users on other ActivityPub-compatible servers.
- The SPA builds into `api/public` so one process serves both the API and the frontend in production.

---

## Tech stack

| Layer | Technology |
|---|---|
| Runtime (API) | [Bun](https://bun.sh) |
| HTTP framework | [Hono](https://hono.dev) |
| Database | SQLite via [Kysely](https://kysely.dev) + [@meck93/kysely-bun-sqlite](https://www.npmjs.com/package/@meck93/kysely-bun-sqlite) |
| Auth | JWT, bcrypt password hashing, per-user RSA key pairs (ActivityPub signing) |
| Client runtime | Browser; React 19 |
| Client build | [Vite](https://vitejs.dev) 7 |
| UI | [MUI](https://mui.com) 7 (Material UI) + Emotion |
| Client state | [TanStack Query](https://tanstack.com/query/latest) + [Zustand](https://github.com/pmndrs/zustand) |
| Client routing | [React Router](https://reactrouter.com) 7 |

---

## Repository layout

```
api/        — Backend (Bun, Hono, SQLite, ActivityPub)
client/     — Frontend (React, Vite, MUI)
docs/       — Documentation
```

---

## Prerequisites

- **Bun** — [bun.sh](https://bun.sh). Required to run the API.
- **Node.js 18+** — Required to install and build the client (npm + Vite).

---

## Setup

### 1. API

```bash
cd api
cp .env.example .env
# Edit .env — see Configuration section below
bun install
bun run start:dev
```

On startup the server:
- Creates the SQLite file at `DB_PATH` if it does not exist and runs `ensureSchema`.
- Ensures a single row in `server_settings` (seeded from env defaults if not present).
- Runs admin bootstrap: creates the user specified by `ADMIN_USER` / `ADMIN_PASS` if that username does not exist yet.
- Listens on `PORT`.

Verify: `curl http://localhost:3000/api/health` → `{"status":"ok"}`

### 2. Client

```bash
cd client
npm install
npm run dev
```

Vite starts a dev server at `http://localhost:5173`. The client talks to the API at `API_BASE` (default `http://localhost:3000`; see `client/src/config.ts`).

---

## Configuration

### API environment variables (`api/.env`)

Bun loads `.env` automatically. Copy `api/.env.example` to `api/.env` and fill in:

| Variable | Required | Description |
|---|---|---|
| `PORT` | Yes | TCP port the server listens on (e.g. `3000`) |
| `DOMAIN` | Yes | Public hostname used in actor URLs and HTTP Signatures (e.g. `localhost` or `example.com`) |
| `PROTOCOL` | Yes | `http` or `https` |
| `NODE_ENV` | Yes | `development` or `production` |
| `DB_PATH` | Yes | Path to the SQLite file (e.g. `./node.db`) |
| `ADMIN_USER` | Yes | Username for the bootstrap admin account |
| `ADMIN_PASS` | Yes | Password for the bootstrap admin account |
| `JWT_SECRET` | Yes | Secret used to sign and verify JWTs |
| `ADMIN_DISPLAY_NAME` | No | Display name for the bootstrap admin (default: `"admin"`) |
| `ADMIN_SUMMARY` | No | Bio for the bootstrap admin (default: `"Server Administrator"`) |
| `REGISTRATION_MODE` | No | `open` or `invite`; only read when `server_settings` row is first created |
| `ALLOW_PUBLIC_PEERS` | No | `true`/`false`; default `true` |
| `AUTO_FETCH_PEER_LINKS` | No | `true`/`false`; default `false` |

`REGISTRATION_MODE`, `ALLOW_PUBLIC_PEERS`, and `AUTO_FETCH_PEER_LINKS` are seeded into the database on first run. After that, use `PATCH /api/admin/settings` to change them; the env vars are no longer read.

### Client config (`client/src/config.ts`)

| Export | Description | Default |
|---|---|---|
| `API_BASE` | Base URL for all API requests | `http://localhost:3000` |
| `ENV` | Environment label | `'development'` |

Change `API_BASE` and rebuild to point the client at a different host. In production the SPA is typically served from the same origin as the API:

```ts
export const API_BASE = import.meta.env.PROD ? window.location.origin : "http://localhost:3000"
```

---

## Scripts

### API (`api/`)

| Script | Command |
|---|---|
| `start` | `bun run src/server.ts` |
| `start:dev` | `bun --watch src/server.ts` |
| `start:prod` | `bun run dist/server.js` |
| `build` | `bun build src/server.ts --outdir dist --target bun` |
| `lint` | `eslint "{src,apps,libs,test}/**/*.ts" --fix` |
| `format` | `prettier --write "src/**/*.ts" "test/**/*.ts"` |
| `merge-docs` | `node docs/mergeOpenapi.js` |
| `docker:up` | `docker-compose -f docker/docker-compose.yml up` |
| `docker:down` | `docker-compose -f docker/docker-compose.yml down` |
| `docker:build` | `docker-compose -f docker/docker-compose.yml build` |
| `docker:logs` | `docker-compose -f docker/docker-compose.yml logs -f` |

### Client (`client/`)

| Script | Command |
|---|---|
| `dev` | `vite` |
| `build` | `tsc -b && vite build` (output → `api/public`) |
| `preview` | `vite preview` |
| `lint` | `eslint .` |

---

## Database

SQLite, single file. Schema is managed via `ensureSchema()` on startup — `CREATE TABLE IF NOT EXISTS` for all tables; no migration system. Tables: `users`, `credentials`, `token_blacklist`, `server_settings`, `invite_tokens`, `posts`, `announces`, `likes`, `follows`.

Notable: the `follows` table is **dropped and recreated** on every startup to enforce the actor-URL-based schema (migrating from an older username-based layout). Any existing follow rows are lost on restart if the old schema is in place.

Backup: copy the SQLite file. No built-in backup tooling.

---

## ActivityPub

Each user gets an actor document at `GET /u/:username` (`application/activity+json`). Per-user RSA key pairs are stored in `credentials` and used to sign outbound HTTP requests (fan-out, follow delivery).

**Federation flow (outbound):** local user creates a post → `post.created` event → `FanOutActivity` delivers a `Create` activity to each remote follower's inbox, signed with the author's private key.

**Federation flow (inbound):** remote server `POST /u/:username/inbox` with an HTTP Signature → `SignatureGuard` fetches the sender's actor and verifies the signature → activity dispatched to handlers (`HandleS2SFollowActivity`, `HandleS2SCreateActivity`, `HandleS2SAnnounceActivity`).

**C2S:** authenticated users `POST /u/:username/outbox` with a `Create`, `Follow`, or `Announce` activity. Handlers process and dispatch accordingly.

**Browser proxy:** `GET /api/proxy?url=<encoded>` (Bearer required) lets the SPA fetch remote ActivityPub resources through the server, avoiding CORS issues.

WebFinger is available at `GET /.well-known/webfinger?resource=acct:user@domain` for actor discovery.

---

## Deployment

### Single server

```bash
# Build API
cd api && bun install && bun run build

# Build client (outputs to api/public)
cd ../client && npm install && npm run build

# (Optional) generate merged OpenAPI spec
cd ../api && node docs/mergeOpenapi.js

# Run
cd api
NODE_ENV=production bun run start:prod
```

Place a reverse proxy (nginx, Caddy) in front to handle TLS and forward to `http://127.0.0.1:PORT`. Set `DOMAIN` and `PROTOCOL=https` to match the public URL; actor URLs and HTTP Signatures depend on these values being correct.

### Docker (multi-instance)

The repo includes a Compose setup under `api/docker/` that runs three independent instances behind nginx — useful for testing federation locally.

```bash
cd api
bun run build
docker-compose -f docker/docker-compose.yml build
docker-compose -f docker/docker-compose.yml up -d
```

Each instance has its own `DOMAIN`, `DB_PATH`, and data volume. Add `127.0.0.1 instance1 instance2 instance3` to `/etc/hosts` to resolve them from the host.

### Production checklist

- Set `PROTOCOL=https` and terminate TLS at the reverse proxy.
- Use a strong, unique `JWT_SECRET` per instance.
- Set `DOMAIN` to the public hostname; DNS must point to the server.
- Place `DB_PATH` on a persistent volume with read/write access for the process user.
- Back up the SQLite file regularly (no built-in script provided).
- Capture and rotate stdout/stderr logs via your process manager.
- On updates: `bun install`, `bun run build` in `api/`; `npm run build` in `client/`; restart the server. Schema is `CREATE IF NOT EXISTS`; no migration tooling — test schema changes against a copy of the database before deploying.

---

## Tests

Unit and integration tests are under `api/tests/`. Run with Bun's test runner:

```bash
cd api
bun test
```

Integration tests in `api/tests/integration/test_endpoints.sh` hit real HTTP endpoints and require a running server.

---

## Troubleshooting

| Error | Cause / Fix |
|---|---|
| `DB_PATH environment variable is not set` | Set `DB_PATH` in `.env` or the shell environment |
| `ADMIN_USER and ADMIN_PASS environment variables are required` | Set both in `.env` for admin bootstrap |
| `DOMAIN and PROTOCOL must be configured` | Set `DOMAIN` and `PROTOCOL` in env; required for any endpoint that builds absolute URLs |
| `401` on protected routes | Send `Authorization: Bearer <token>`; token from `POST /api/auth/login`. If logged out, the token is blacklisted — log in again |
| `403` on admin routes | The authenticated user needs `is_admin`; the bootstrap admin has it by default |
| Client cannot reach API | Check `API_BASE` in `client/src/config.ts`, confirm CORS is enabled, and confirm the API is listening on the expected host/port |
| OpenAPI or docs `404` | Run `merge-docs` and ensure the output file is where `AppController` expects it; confirm `public/apiDocs.html` exists |

---

## Documentation

Additional detail is in `docs/`:

- `02-architecture.md` — Module layout, request flow, event bus
- `03-api-reference.md` — All endpoints with request/response shapes
- `04-database.md` — Table schemas and relationships
- `05-configuration.md` — Full env variable reference
- `06-setup-and-development.md` — Dev workflow and scripts
- `07-deployment.md` — Single-server and Docker deployment
- `08-client.md` — SPA structure, routing, services, hooks
- `09-activitypub.md` — ActivityPub and federation implementation detail