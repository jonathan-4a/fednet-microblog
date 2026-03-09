// src/composition-root.ts

import { db } from "./connection";
import { ensureSchema as ensureSchemaFunction } from "./schema";
import type { Kysely } from "kysely";
import {
  createTransactionManager,
  createEventBus,
  createServerSettingsRepository,
  createGetServerSettings,
  createUpdateServerSettings,
  createAppRoutes as createAppRoutesBase,
  createIdGenerator,
} from "@shared";
import type { ServerSettingsTable } from "@shared";
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
import type {
  CredentialsTable,
  TokenBlacklistTable,
  InviteTokensTable,
} from "@auth";
import {
  createAdminRoutes as createAdminRoutesBase,
  createAdminUserRepository,
  createAdminPostRepository,
  initializeAdmin as initializeAdminBase,
  createEnsureAdminUser,
  type AdminBootstrapConfig,
} from "@admin";
import {
  createUserRepository,
  createDeleteUserWithCascade,
  type UsersTable,
  createUsersRoutes as createUsersRoutesBase,
} from "@users";
import {
  createPostsRoutes as createPostsRoutesBase,
  createGetLiked,
  createCreatePost,
  createGetPostByNoteId,
  createPostRepository,
  createLikesRepository,
  createAnnouncesRepository,
  type PostsTable,
  type LikesTable,
  type AnnouncesTable,
} from "@posts";
import {
  createSocialsRoutes as createSocialsRoutesBase,
  createFollowRepository,
  type FollowsTable,
} from "@socials";
import {
  createNotificationRepository,
  createNotificationsRoutes as createNotificationsRoutesBase,
  createNotificationActivityEmitter,
  createNotificationActivityListener,
} from "@notifications";
import type { NotificationsTable } from "@notifications";
import type { PostCreatedEvent } from "@posts";
import {
  createActivityPubRoutes as createActivityPubRoutesBase,
  createGetWebFinger,
  createGetActor,
  createGetOutbox,
  createDispatchS2SActivityEvent,
  createDispatchC2SActivityEvent,
  createFanOutActivity,
  Note,
  Collection,
  WebFinger,
  Actor,
  Activity,
  HandleC2SFollowActivity,
  HandleC2SCreateActivity,
  HandleC2SAnnounceActivity,
  HandleC2SLikeActivity,
  HandleS2SFollowActivity,
  HandleS2SCreateActivity,
  HandleS2SAnnounceActivity,
  HandleS2SLikeActivity,
  HandlePostCreated,
  HttpSignatureService,
  FederationDelivery,
  createGetRemoteResource,
  createResolveNoteAuthorActor,
  type C2SActivitySubmittedEvent,
  type ActivityReceivedEvent,
} from "@apcore";

const transactionManager = createTransactionManager(db);
const serverSettingsRepository = createServerSettingsRepository(
  db as unknown as Kysely<{ server_settings: ServerSettingsTable }>,
);
const getServerSettings = createGetServerSettings(serverSettingsRepository);
const updateServerSettings = createUpdateServerSettings(
  serverSettingsRepository,
  getServerSettings,
);
const eventBus = createEventBus();

const protocol = process.env.PROTOCOL ?? "http";
const port = process.env.PORT ?? "3000";
const domain = process.env.DOMAIN ?? "localhost";
const host = port === "80" || port === "443" ? domain : `${domain}:${port}`;
const ourOrigin = `${protocol}://${host}`;

const userRepository = createUserRepository(
  db as unknown as Kysely<{ users: UsersTable }>,
);
const followRepository = createFollowRepository(
  db as unknown as Kysely<{ follows: FollowsTable }>,
);
const credentialsRepository = createCredentialsRepository(
  db as unknown as Kysely<{ credentials: CredentialsTable }>,
);
const tokenBlacklistRepository = createTokenBlacklistRepository(
  db as unknown as Kysely<{ token_blacklist: TokenBlacklistTable }>,
);
const postRepository = createPostRepository(
  db as unknown as Kysely<{ posts: PostsTable }>,
);
const likesRepository = createLikesRepository(
  db as unknown as Kysely<{ likes: LikesTable }>,
);
const announcesRepository = createAnnouncesRepository(
  db as unknown as Kysely<{ announces: AnnouncesTable }>,
);
const notificationRepository = createNotificationRepository(
  db as unknown as Kysely<{ notifications: NotificationsTable }>,
);

const httpSignatureService = new HttpSignatureService(
  credentialsRepository,
  ourOrigin,
);
const federationDelivery = new FederationDelivery(
  httpSignatureService,
  ourOrigin,
);
const jwtTokenService = createJwtTokenService(
  process.env.JWT_SECRET!,
  tokenBlacklistRepository,
);
const authGuard = createAuthGuard(jwtTokenService);

const noteSerializer = new Note();
const activitySerializer = new Activity();
const collectionSerializer = new Collection();
const webFingerSerializer = new WebFinger();
const actorSerializer = new Actor();

const getWebFinger = createGetWebFinger(
  userRepository,
  credentialsRepository,
  webFingerSerializer,
);
const getActor = createGetActor(
  userRepository,
  credentialsRepository,
  actorSerializer,
);
const getOutbox = createGetOutbox(
  postRepository,
  userRepository,
  likesRepository,
  announcesRepository,
  noteSerializer,
  collectionSerializer,
);
const dispatchS2SActivityEvent = createDispatchS2SActivityEvent(
  eventBus,
  host,
  protocol,
);
const dispatchC2SActivityEvent = createDispatchC2SActivityEvent(
  eventBus,
  host,
  protocol,
);

const deleteUserWithCascade = createDeleteUserWithCascade(
  userRepository,
  postRepository,
  likesRepository,
  announcesRepository,
  followRepository,
  transactionManager,
);

const createPostUseCase = createCreatePost(
  postRepository,
  userRepository,
  createIdGenerator(),
  eventBus,
  noteSerializer,
  activitySerializer,
);

const fanOutActivity = createFanOutActivity(
  followRepository,
  federationDelivery,
  ourOrigin,
);
const getPostByNoteId = createGetPostByNoteId(postRepository, ourOrigin);
const resolveNoteAuthorActor = createResolveNoteAuthorActor(
  getPostByNoteId,
  ourOrigin,
);

const notificationEmitter = createNotificationActivityEmitter(eventBus);
createNotificationActivityListener(eventBus, notificationRepository);

const handleC2SFollow = new HandleC2SFollowActivity(
  followRepository,
  federationDelivery,
  ourOrigin,
  notificationEmitter,
);
const handleC2SCreate = new HandleC2SCreateActivity(
  createPostUseCase,
  federationDelivery,
  ourOrigin,
);
const handleC2SAnnounce = new HandleC2SAnnounceActivity(
  announcesRepository,
  federationDelivery,
  resolveNoteAuthorActor,
  notificationEmitter,
);
const handleC2SLike = new HandleC2SLikeActivity(
  federationDelivery,
  likesRepository,
  ourOrigin,
  resolveNoteAuthorActor,
  notificationEmitter,
);
const handleS2SFollow = new HandleS2SFollowActivity(
  followRepository,
  ourOrigin,
  notificationEmitter,
);
const handleS2SCreate = new HandleS2SCreateActivity(
  postRepository,
  ourOrigin,
  resolveNoteAuthorActor,
  notificationEmitter,
);
const handleS2SAnnounce = new HandleS2SAnnounceActivity(
  announcesRepository,
  ourOrigin,
  resolveNoteAuthorActor,
  notificationEmitter,
);
const handleS2SLike = new HandleS2SLikeActivity(
  likesRepository,
  resolveNoteAuthorActor,
  notificationEmitter,
);
const handlePostCreated = new HandlePostCreated(
  fanOutActivity,
  resolveNoteAuthorActor,
  notificationEmitter,
);

async function onPostCreated(event: PostCreatedEvent): Promise<void> {
  await handlePostCreated.handle(event);
}

async function onC2SActivitySubmitted(
  event: C2SActivitySubmittedEvent,
): Promise<void> {
  await handleC2SFollow.handle(event);
  await handleC2SCreate.handle(event);
  await handleC2SAnnounce.handle(event);
  await handleC2SLike.handle(event);
}

async function onActivityReceived(event: ActivityReceivedEvent): Promise<void> {
  await handleS2SFollow.handle(event);
  await handleS2SCreate.handle(event);
  await handleS2SAnnounce.handle(event);
  await handleS2SLike.handle(event);
}

eventBus.on("post.created", onPostCreated);
eventBus.on("activity.c2s.submitted", onC2SActivitySubmitted);
eventBus.on("activity.received", onActivityReceived);

export async function ensureSchema() {
  return await ensureSchemaFunction(db);
}

export async function ensureServerSettings(): Promise<void> {
  await getServerSettings.execute();
}

export function createAppRoutes() {
  const getRemoteResource = createGetRemoteResource(httpSignatureService);
  return createAppRoutesBase(
    getServerSettings,
    protocol,
    domain,
    port,
    ((c, next) => authGuard.authenticate(c, next)) as any,
    getRemoteResource,
  );
}

export function createAuthRoutes() {
  const inviteTokenRepository = createInviteTokenRepository(
    db as unknown as Kysely<{ invite_tokens: InviteTokensTable }>,
  );
  return createAuthRoutesBase(
    credentialsRepository,
    tokenBlacklistRepository,
    inviteTokenRepository,
    userRepository,
    getServerSettings,
    transactionManager,
    process.env.JWT_SECRET!,
    domain,
    protocol,
  );
}

export function createAdminRoutes() {
  const inviteTokenRepository = createInviteTokenRepository(
    db as unknown as Kysely<{ invite_tokens: InviteTokensTable }>,
  );
  const adminUserRepository = createAdminUserRepository(
    db as unknown as Kysely<{ users: UsersTable }>,
  );
  const adminPostRepository = createAdminPostRepository(
    db as unknown as Kysely<{ posts: PostsTable }>,
  );
  return createAdminRoutesBase(
    adminUserRepository,
    adminPostRepository,
    transactionManager,
    getServerSettings,
    updateServerSettings,
    inviteTokenRepository,
    jwtTokenService,
    deleteUserWithCascade,
    domain,
    port,
  );
}

export function createUsersRoutes() {
  const inviteTokenRepository = createInviteTokenRepository(
    db as unknown as Kysely<{ invite_tokens: InviteTokensTable }>,
  );
  const generateInviteToken = new GenerateInviteToken(
    inviteTokenRepository,
    getServerSettings,
  );
  return createUsersRoutesBase(
    userRepository,
    transactionManager,
    (c, next) => authGuard.authenticate(c, next),
    generateInviteToken,
    deleteUserWithCascade,
  );
}

export function createPostsRoutes() {
  return createPostsRoutesBase(
    postRepository,
    likesRepository,
    announcesRepository,
    noteSerializer,
    collectionSerializer,
    activitySerializer,
    host,
    protocol,
    ((c: unknown, next: () => Promise<void>) =>
      authGuard.authenticate(
        c as Parameters<typeof authGuard.authenticate>[0],
        next as Parameters<typeof authGuard.authenticate>[1],
      )) as Parameters<typeof createPostsRoutesBase>[8],
  );
}

export function createSocialsRoutes() {
  const getLiked = createGetLiked(
    likesRepository,
    userRepository,
    collectionSerializer,
  );
  return createSocialsRoutesBase(
    followRepository,
    userRepository,
    getLiked,
    collectionSerializer,
    host,
    protocol,
  );
}

export function createNotificationsRoutes() {
  return createNotificationsRoutesBase(
    notificationRepository,
    (c, next) => authGuard.authenticate(c, next),
    host,
    protocol,
  );
}

export function createActivityPubRoutes() {
  return createActivityPubRoutesBase(
    getWebFinger,
    getActor,
    getOutbox,
    dispatchS2SActivityEvent,
    dispatchC2SActivityEvent,
    host,
    protocol,
    domain,
    (c, next) => authGuard.authenticate(c, next),
  );
}

export function initializeAdmin() {
  const ensureAdminUser = createEnsureAdminUser(
    userRepository,
    credentialsRepository,
    createPasswordHasherService(),
    createKeyPairGeneratorService(),
    transactionManager,
  );

  const adminConfig: AdminBootstrapConfig = {
    username: process.env.ADMIN_USER,
    password: process.env.ADMIN_PASS,
    displayName: process.env.ADMIN_DISPLAY_NAME,
    summary: process.env.ADMIN_SUMMARY,
  };

  return initializeAdminBase(ensureAdminUser, adminConfig);
}
