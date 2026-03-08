# ActivityPub Microblogging

A self-hostable microblogging server with ActivityPub federation support. Single codebase — a Bun/Hono API backed by SQLite and a React SPA.

---

## Features

- Register, post short notes, reply, like, and boost (announce) posts
- Follow/unfollow users on the same instance or on remote ActivityPub-compatible servers
- Full ActivityPub support: actors, WebFinger, inbox/outbox, HTTP Signatures
- Invite-only or open registration, configurable at runtime
- Admin panel: manage users, posts, server settings, and invite tokens
- The SPA builds into `api/public` — one process serves both API and frontend in production

---

## Tech stack

| Layer | Technology |
|---|---|
| Runtime (API) | [Bun](https://bun.sh) |
| HTTP framework | [Hono](https://hono.dev) |
| Database | SQLite via [Kysely](https://kysely.dev) + [@meck93/kysely-bun-sqlite](https://www.npmjs.com/package/@meck93/kysely-bun-sqlite) |
| Auth | JWT, bcrypt password hashing, per-user RSA key pairs |
| Client | React 19, [Vite](https://vitejs.dev) 7 |
| UI | [MUI](https://mui.com) 7 + Emotion |
| Client state | [TanStack Query](https://tanstack.com/query/latest) + [Zustand](https://github.com/pmndrs/zustand) |
| Routing | [React Router](https://reactrouter.com) 7 |

---

## Repository layout

```
api/        — Backend (Bun, Hono, SQLite, ActivityPub)
client/     — Frontend (React, Vite, MUI)
docs/       — Documentation
```

---

## Prerequisites

- **Bun** — [bun.sh](https://bun.sh) — required to run the API
- **Node.js 18+** — required to install and build the client

---

## Setup

### 1. API

```bash
cd api
cp .env.example .env
# Edit .env — see Configuration below
bun install
bun run start:dev
```

On startup the server will:

- Create the SQLite file at `DB_PATH` if it does not exist
- Run `ensureSchema` to create all tables
- Seed a `server_settings` row from env defaults if one does not exist
- Create the bootstrap admin user from `ADMIN_USER` / `ADMIN_PASS` if that username does not exist

Verify the server is running:

```bash
curl http://localhost:3000/api/health
# {"status":"ok"}
```

### 2. Client

```bash
cd client
npm install
npm run dev
```

Vite starts at `http://localhost:5173` and proxies API calls to `API_BASE` (default `http://localhost:3000`).

---

## Configuration

### API — `api/.env`

Copy `api/.env.example` to `api/.env`. Bun loads it automatically.

| Variable | Required | Description |
|---|---|---|
| `PORT` | Yes | TCP port the server listens on (e.g. `3000`) |
| `DOMAIN` | Yes | Public hostname for actor URLs and HTTP Signatures (e.g. `example.com`) |
| `PROTOCOL` | Yes | `http` or `https` |
| `NODE_ENV` | Yes | `development` or `production` |
| `DB_PATH` | Yes | Path to the SQLite file (e.g. `./node.db`) |
| `ADMIN_USER` | Yes | Username for the bootstrap admin account |
| `ADMIN_PASS` | Yes | Password for the bootstrap admin account |
| `JWT_SECRET` | Yes | Secret used to sign and verify JWTs |
| `ADMIN_DISPLAY_NAME` | No | Display name for the bootstrap admin (default: `"admin"`) |
| `ADMIN_SUMMARY` | No | Bio for the bootstrap admin (default: `"Server Administrator"`) |
| `REGISTRATION_MODE` | No | `open` or `invite` — seeded on first run only (default: `open`) |
| `ALLOW_PUBLIC_PEERS` | No | `true` / `false` — seeded on first run only (default: `true`) |
| `AUTO_FETCH_PEER_LINKS` | No | `true` / `false` — seeded on first run only (default: `false`) |

> `REGISTRATION_MODE`, `ALLOW_PUBLIC_PEERS`, and `AUTO_FETCH_PEER_LINKS` are only read when the `server_settings` row is first created. After that, use `PATCH /api/admin/settings` to update them.

### Client — `client/src/config.ts`

| Export | Description | Default |
|---|---|---|
| `API_BASE` | Base URL for all API requests | `http://localhost:3000` |
| `ENV` | Environment label | `'development'` |

For production, set `API_BASE` to the server's public origin or use:

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

- Single SQLite file; path set via `DB_PATH`
- Schema applied on startup via `ensureSchema()` — `CREATE TABLE IF NOT EXISTS`; no migration system
- Tables: `users`, `credentials`, `token_blacklist`, `server_settings`, `invite_tokens`, `posts`, `announces`, `likes`, `follows`

> **Note:** The `follows` table is dropped and recreated on every startup to enforce the actor-URL-based schema. Existing follow rows will be lost if the old username-based schema is present.

Backup by copying the SQLite file. No built-in backup tooling is provided.

---

## ActivityPub

Each user is an ActivityPub Actor with a per-user RSA key pair stored in `credentials`, used to sign all outbound requests.

| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/.well-known/webfinger` | GET | None | Actor discovery |
| `/u/:username` | GET | None | Actor document |
| `/u/:username/outbox` | GET | None | User's activity collection |
| `/u/:username/outbox` | POST | Bearer | Submit `Create`, `Follow`, `Announce` (C2S) |
| `/u/:username/inbox` | POST | HTTP Signature | Receive activities from remote servers (S2S) |

**Outbound federation**

- Local post created → `post.created` event → `FanOutActivity` delivers a signed `Create` activity to each remote follower's inbox

**Inbound federation**

- Remote `POST /u/:username/inbox` → `SignatureGuard` fetches the sender's actor and verifies the HTTP Signature → activity dispatched to the appropriate S2S handler

**Browser proxy**

- `GET /api/proxy?url=<encoded>` (Bearer required) — server fetches the remote ActivityPub resource on behalf of the client, avoiding CORS issues

---

## Deployment

### Single server

```bash
# Build API
cd api && bun install && bun run build

# Build client (outputs to api/public)
cd ../client && npm install && npm run build

# Optional: generate merged OpenAPI spec
cd ../api && node docs/mergeOpenapi.js

# Start
NODE_ENV=production bun run start:prod
```

Place nginx or Caddy in front for TLS termination, proxying to `http://127.0.0.1:PORT`. `DOMAIN` and `PROTOCOL` must match the public URL for actor URLs and HTTP Signatures to be valid.

### Docker (multi-instance)

A Compose setup under `api/docker/` runs three independent instances behind nginx, intended for local federation testing.

```bash
cd api
bun run build
docker-compose -f docker/docker-compose.yml build
docker-compose -f docker/docker-compose.yml up -d
```

Add the following to `/etc/hosts` to resolve instances from the host:

```
127.0.0.1 instance1 instance2 instance3
```

Each instance requires its own `DOMAIN`, `DB_PATH`, and data volume configured in `docker-compose.yml`.

### Production checklist

- `PROTOCOL=https` with TLS termination at the reverse proxy
- Strong, unique `JWT_SECRET` per instance
- `DOMAIN` set to the public hostname with DNS pointing to the server
- `DB_PATH` on a persistent volume with read/write permissions for the process user
- Regular backups of the SQLite file
- stdout/stderr captured and rotated via a process manager
- On updates: `bun install` + `bun run build` in `api/`, `npm run build` in `client/`, then restart — no migration tooling, test schema changes against a copy of the database first

---

## Tests

```bash
cd api
bun test
```

Unit and integration tests are under `api/tests/`. Integration tests in `api/tests/integration/test_endpoints.sh` require a running server.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `DB_PATH environment variable is not set` | Set `DB_PATH` in `.env` or the shell |
| `ADMIN_USER and ADMIN_PASS environment variables are required` | Set both in `.env` |
| `DOMAIN and PROTOCOL must be configured` | Set `DOMAIN` and `PROTOCOL` in env |
| `401` on protected routes | Send `Authorization: Bearer <token>` — token from `POST /api/auth/login`; re-login if previously logged out |
| `403` on admin routes | Authenticated user must have `is_admin`; the bootstrap admin has it by default |
| Client cannot reach API | Check `API_BASE` in `client/src/config.ts`, confirm CORS is enabled, confirm the API is on the expected host/port |
| OpenAPI or docs `404` | Run `merge-docs` and confirm the output is where `AppController` expects it; confirm `public/apiDocs.html` exists |