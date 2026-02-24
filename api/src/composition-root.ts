// src/composition-root.ts

import { db } from "./connection";
import { ensureSchema as ensureSchemaFunction } from "./schema";
import type { Kysely } from "kysely";
import {
  createTransactionManager,
  createEventBus,
  createGetServerSettings,
  createUpdateServerSettings,
  createAppRoutes as createAppRoutesBase,
  createIdGenerator,
} from "@shared";
import {
  createAuthRoutes as createAuthRoutesBase,
  createInviteTokenRepository,
  createTokenBlacklistRepository,
  createCredentialsRepository,
  createPasswordHasherService,
  createKeyPairGeneratorService,
  createJwtTokenService,
  createAuthGuard,
  GenerateInviteToken,
} from "@auth";
import {
  createAdminRoutes as createAdminRoutesBase,
  initializeAdmin as initializeAdminBase,
  createEnsureAdminUser,
} from "@admin";
import {
  createUserRepository,
  type UsersTable,
  createUsersRoutes as createUsersRoutesBase,
} from "@users";
import {
  createPostsRoutes as createPostsRoutesBase,
  createGetLiked,
  createCreatePost,
  createPostRepository,
} from "@posts";
import { createSocialsRoutes as createSocialsRoutesBase } from "@socials";
import { createFollowRepository } from "@socials";
import {
  createActivityPubRoutes as createActivityPubRoutesBase,
  createFanOutActivity,
  Note,
  Collection,
  Activity,
  HandleC2SFollowActivity,
  HandleC2SCreateActivity,
  HandleC2SAnnounceActivity,
  HandleS2SFollowActivity,
  HandleS2SCreateActivity,
  HandleS2SAnnounceActivity,
  HttpSignatureService,
  FederationDelivery,
  createGetRemoteResource,
  type C2SActivitySubmittedEvent,
  type ActivityReceivedEvent,
} from "@apcore";
import type { PostCreatedEvent } from "@posts";
import { createAnnouncesRepository } from "@posts";

const transactionManager = createTransactionManager(db);
const getServerSettings = createGetServerSettings(db);
const updateServerSettings = createUpdateServerSettings(db);
const eventBus = createEventBus();

const followRepository = createFollowRepository(db);
const credentialsRepository = createCredentialsRepository(
  db as unknown as Parameters<typeof createCredentialsRepository>[0],
);
const httpSignatureService = new HttpSignatureService(credentialsRepository);
const federationDelivery = new FederationDelivery(httpSignatureService);
const handleC2SFollow = new HandleC2SFollowActivity(
  followRepository,
  federationDelivery,
);
const noteSerializer = new Note();
const activitySerializer = new Activity();
const createPostUseCase = createCreatePost(
  db as Parameters<typeof createCreatePost>[0],
  createIdGenerator(),
  eventBus,
  noteSerializer,
  activitySerializer,
);
const handleC2SCreate = new HandleC2SCreateActivity(createPostUseCase);
const handleS2SFollow = new HandleS2SFollowActivity(followRepository);
const postRepository = createPostRepository(
  db as Parameters<typeof createPostRepository>[0],
);
const announcesRepository = createAnnouncesRepository(
  db as Parameters<typeof createAnnouncesRepository>[0],
);
const handleC2SAnnounce = new HandleC2SAnnounceActivity(announcesRepository);
const handleS2SCreate = new HandleS2SCreateActivity(postRepository);
const handleS2SAnnounce = new HandleS2SAnnounceActivity(announcesRepository);
const fanOutActivity = createFanOutActivity(
  db as Parameters<typeof createFanOutActivity>[0],
);

eventBus.on(
  "post.created",
  async (event: PostCreatedEvent) => {
    const { actorUrl, createActivity } = event.payload;
    try {
      await fanOutActivity.execute({
        actorUrl,
        activity: createActivity as Record<string, unknown>,
      });
    } catch (err) {
      console.error("[post.created] Fan-out failed:", (err as Error).message);
    }
  },
);

eventBus.on(
  "activity.c2s.submitted",
  async (event: C2SActivitySubmittedEvent) => {
    await handleC2SFollow.handle(event);
    await handleC2SCreate.handle(event);
    await handleC2SAnnounce.handle(event);
  },
);
eventBus.on("activity.received", async (event: ActivityReceivedEvent) => {
  await handleS2SFollow.handle(event);
  await handleS2SCreate.handle(event);
  await handleS2SAnnounce.handle(event);
});

export async function ensureSchema() {
  return await ensureSchemaFunction(db);
}

/** Ensures the server_settings row exists (creates defaults if table is empty). */
export async function ensureServerSettings(): Promise<void> {
  await getServerSettings.execute();
}

export function createAppRoutes() {
  const tokenBlacklistRepository = createTokenBlacklistRepository(
    db as unknown as Parameters<typeof createTokenBlacklistRepository>[0],
  );
  const jwtSecret = process.env.JWT_SECRET!;
  const jwtTokenService = createJwtTokenService(
    jwtSecret,
    tokenBlacklistRepository,
  );
  const authGuard = createAuthGuard(jwtTokenService);
  const getRemoteResource = createGetRemoteResource(httpSignatureService);
  return createAppRoutesBase(
    db,
    ((c, next) => authGuard.authenticate(c, next)) as any,
    getRemoteResource,
  );
}

export function createAuthRoutes() {
  const userRepository = createUserRepository(
    db as unknown as Kysely<{ users: UsersTable }>,
  );
  const jwtSecret = process.env.JWT_SECRET!;
  return createAuthRoutesBase(
    db as unknown as Parameters<typeof createAuthRoutesBase>[0],
    userRepository,
    getServerSettings,
    transactionManager,
    jwtSecret,
  );
}

export function createAdminRoutes() {
  const inviteTokenRepository = createInviteTokenRepository(
    db as unknown as Parameters<typeof createInviteTokenRepository>[0],
  );
  const tokenBlacklistRepository = createTokenBlacklistRepository(
    db as unknown as Parameters<typeof createTokenBlacklistRepository>[0],
  );
  const jwtTokenService = createJwtTokenService(
    process.env.JWT_SECRET!,
    tokenBlacklistRepository,
  );

  return createAdminRoutesBase(
    db,
    transactionManager,
    getServerSettings,
    updateServerSettings,
    inviteTokenRepository,
    jwtTokenService,
  );
}

export function createUsersRoutes() {
  const tokenBlacklistRepository = createTokenBlacklistRepository(
    db as unknown as Parameters<typeof createTokenBlacklistRepository>[0],
  );
  const jwtSecret = process.env.JWT_SECRET!;
  const jwtTokenService = createJwtTokenService(
    jwtSecret,
    tokenBlacklistRepository,
  );
  const authGuard = createAuthGuard(jwtTokenService);
  const inviteTokenRepository = createInviteTokenRepository(
    db as unknown as Parameters<typeof createInviteTokenRepository>[0],
  );
  const generateInviteToken = new GenerateInviteToken(
    inviteTokenRepository,
    getServerSettings,
  );
  return createUsersRoutesBase(
    db as unknown as Kysely<{ users: UsersTable }>,
    transactionManager,
    (c, next) => authGuard.authenticate(c, next),
    generateInviteToken,
  );
}

export function createPostsRoutes() {
  const noteSerializer = new Note();
  const collectionSerializer = new Collection();
  const activitySerializer = new Activity();
  return createPostsRoutesBase(
    db,
    noteSerializer,
    collectionSerializer,
    activitySerializer,
  );
}

export function createSocialsRoutes() {
  const collectionSerializer = new Collection();
  const userRepository = createUserRepository(
    db as unknown as Kysely<{ users: UsersTable }>,
  );
  const getLiked = createGetLiked(db, collectionSerializer);
  return createSocialsRoutesBase(
    db,
    userRepository,
    getLiked,
    collectionSerializer,
  );
}

export function createActivityPubRoutes() {
  const tokenBlacklistRepository = createTokenBlacklistRepository(
    db as unknown as Parameters<typeof createTokenBlacklistRepository>[0],
  );
  const jwtSecret = process.env.JWT_SECRET!;
  const jwtTokenService = createJwtTokenService(
    jwtSecret,
    tokenBlacklistRepository,
  );
  const authGuard = createAuthGuard(jwtTokenService);
  return createActivityPubRoutesBase(db, eventBus, (c, next) =>
    authGuard.authenticate(c, next),
  );
}

export function initializeAdmin() {
  const userRepository = createUserRepository(
    db as unknown as Kysely<{ users: UsersTable }>,
  );
  const credentialsRepository = createCredentialsRepository(
    db as unknown as Parameters<typeof createCredentialsRepository>[0],
  );
  const passwordHasher = createPasswordHasherService();
  const keyPairGenerator = createKeyPairGeneratorService();

  const ensureAdminUser = createEnsureAdminUser(
    userRepository,
    credentialsRepository,
    passwordHasher,
    keyPairGenerator,
    transactionManager,
  );

  return initializeAdminBase(ensureAdminUser);
}

