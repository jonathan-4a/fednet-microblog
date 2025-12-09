// src/apcore/apcore.di.ts

import type { Kysely } from "kysely";
import type { IEventBus } from "@shared";
import type { IActorSerializer } from "./ports/out/IActorSerializer";
import type { INoteSerializer } from "./ports/out/INoteSerializer";
import type { ICollectionSerializer } from "./ports/out/ICollectionSerializer";
import type { IWebFingerSerializer } from "./ports/out/IWebFingerSerializer";
import { Actor } from "./adapters/serializers/Actor";
import { Note } from "./adapters/serializers/Note";
import { Collection } from "./adapters/serializers/Collection";
import { WebFinger } from "./adapters/serializers/WebFinger";
import { GetWebFinger } from "./usecases/GetWebFinger";
import { GetActor } from "./usecases/GetActor";
import { GetOutbox } from "./usecases/GetOutbox";
import { DispatchS2SActivityEvent } from "./usecases/DispatchS2SActivityEvent";
import { DispatchC2SActivityEvent } from "./usecases/DispatchC2SActivityEvent";
import { FanOutActivity } from "./usecases/FanOutActivity";
import { ActivityPubController } from "./adapters/http/ActivityPubController";
import { createActivityPubRoutes as createActivityPubRoutesFactory } from "./adapters/http/ActivityPubRoutes";
import { HttpSignatureService } from "./adapters/http/HttpSignatureService";
import { FederationDelivery } from "./adapters/http/FederationDelivery";
import { SignatureGuard } from "./adapters/http/SignatureGuard";
import { GetRemoteResource } from "./usecases/GetRemoteResource";
import { createUserRepository } from "@users";
import { createCredentialsRepository } from "@auth";
import {
  createPostRepository,
  createLikesRepository,
  createAnnouncesRepository,
} from "@posts";
import { createFollowRepository } from "@socials";

// Factories - accept external dependencies as parameters

const asUnknown = <T>(db: Kysely<T>) => db as Kysely<unknown>;

export function createGetWebFinger<
  T extends {
    users: import("@users").UsersTable;
    credentials: import("@auth").CredentialsTable;
  },
>(db: Kysely<T>, webFingerSerializer: IWebFingerSerializer) {
  const userRepository = createUserRepository(db);
  const credentialsRepository = createCredentialsRepository(db);
  return new GetWebFinger(
    userRepository,
    credentialsRepository,
    webFingerSerializer,
  );
}

export function createGetActor<
  T extends {
    users: import("@users").UsersTable;
    credentials: import("@auth").CredentialsTable;
  },
>(db: Kysely<T>, actorSerializer: IActorSerializer) {
  const userRepository = createUserRepository(db);
  const credentialsRepository = createCredentialsRepository(db);
  return new GetActor(userRepository, credentialsRepository, actorSerializer);
}

export function createGetOutbox<
  T extends {
    users: import("@users").UsersTable;
    posts: import("@posts").PostsTable;
    likes: import("@posts").LikesTable;
    announces: import("@posts").AnnouncesTable;
  },
>(
  db: Kysely<T>,
  noteSerializer: INoteSerializer,
  collectionSerializer: ICollectionSerializer,
) {
  const postRepository = createPostRepository(db);
  const userRepository = createUserRepository(db);
  const likesRepository = createLikesRepository(db);
  const announcesRepository = createAnnouncesRepository(db);
  return new GetOutbox(
    postRepository,
    userRepository,
    likesRepository,
    announcesRepository,
    noteSerializer,
    collectionSerializer,
  );
}

export function createDispatchS2SActivityEvent(eventBus: IEventBus) {
  return new DispatchS2SActivityEvent(eventBus);
}

export function createDispatchC2SActivityEvent(eventBus: IEventBus) {
  return new DispatchC2SActivityEvent(eventBus);
}

export function createFanOutActivity<
  T extends {
    follows: import("@socials").FollowsTable;
    credentials: import("@auth").CredentialsTable;
  },
>(db: Kysely<T>) {
  const followRepository = createFollowRepository(db);
  const credentialsRepository = createCredentialsRepository(db);
  const httpSignatureService = new HttpSignatureService(credentialsRepository);
  const federationDelivery = new FederationDelivery(httpSignatureService);
  return new FanOutActivity(followRepository, federationDelivery);
}

export function createSignatureGuard() {
  return new SignatureGuard();
}

export function createGetRemoteResource(
  httpSignatureService: HttpSignatureService,
) {
  return new GetRemoteResource(httpSignatureService);
}

export function createActivityPubController<
  T extends {
    users: import("@users").UsersTable;
    credentials: import("@auth").CredentialsTable;
    posts: import("@posts").PostsTable;
    likes: import("@posts").LikesTable;
    announces: import("@posts").AnnouncesTable;
  },
>(db: Kysely<T>, eventBus: IEventBus) {
  const actorSerializer = new Actor();
  const noteSerializer = new Note();
  const collectionSerializer = new Collection();
  const webFingerSerializer = new WebFinger();
  const getWebFinger = createGetWebFinger(db, webFingerSerializer);
  const getActor = createGetActor(db, actorSerializer);
  const getOutbox = createGetOutbox(db, noteSerializer, collectionSerializer);
  const dispatchS2SActivityEvent = createDispatchS2SActivityEvent(eventBus);
  const dispatchC2SActivityEvent = createDispatchC2SActivityEvent(eventBus);

  return new ActivityPubController(
    getWebFinger,
    getActor,
    getOutbox,
    dispatchS2SActivityEvent,
    dispatchC2SActivityEvent,
  );
}

export function createActivityPubRoutes<
  T extends {
    users: import("@users").UsersTable;
    credentials: import("@auth").CredentialsTable;
    posts: import("@posts").PostsTable;
    likes: import("@posts").LikesTable;
    announces: import("@posts").AnnouncesTable;
  },
>(
  db: Kysely<T>,
  eventBus: IEventBus,
  postOutboxAuthMiddleware?: import("./adapters/http/ActivityPubRoutes").AuthMiddleware,
) {
  const actorSerializer = new Actor();
  const noteSerializer = new Note();
  const collectionSerializer = new Collection();
  const webFingerSerializer = new WebFinger();
  const getWebFinger = createGetWebFinger(db, webFingerSerializer);
  const getActor = createGetActor(db, actorSerializer);
  const getOutbox = createGetOutbox(db, noteSerializer, collectionSerializer);
  const dispatchS2SActivityEvent = createDispatchS2SActivityEvent(eventBus);
  const dispatchC2SActivityEvent = createDispatchC2SActivityEvent(eventBus);

  return createActivityPubRoutesFactory(
    getWebFinger,
    getActor,
    getOutbox,
    dispatchS2SActivityEvent,
    dispatchC2SActivityEvent,
    postOutboxAuthMiddleware,
  );
}

