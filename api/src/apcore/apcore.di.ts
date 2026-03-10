// src/apcore/apcore.di.ts
import type { IEventBus } from "@shared";
import type { IUserRepository } from "@users";
import type { ICredentialsRepository } from "@auth";
import type {
  IPostRepository,
  ILikesRepository,
  IAnnouncesRepository,
  IGetPostByNoteId,
} from "@posts";
import type { IFollowRepository } from "@socials";
import type { IActorSerializer } from "./ports/out/IActorSerializer";
import type { INoteSerializer } from "./ports/out/INoteSerializer";
import type { ICollectionSerializer } from "./ports/out/ICollectionSerializer";
import type { IWebFingerSerializer } from "./ports/out/IWebFingerSerializer";
import type { IGetWebFinger } from "./ports/in/IGetWebFinger";
import type { IGetActor } from "./ports/in/IGetActor";
import type { IGetOutbox } from "./ports/in/IGetOutbox";
import type { IDispatchS2SActivityEvent } from "./ports/in/IDispatchS2SActivityEvent";
import type { IDispatchC2SActivityEvent } from "./ports/in/IDispatchC2SActivityEvent";
import type { AuthMiddleware } from "./adapters/http/ActivityPubRoutes";
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
import { ResolveNoteAuthorActor } from "./usecases/ResolveNoteAuthorActor";

export function createGetWebFinger(
  userRepository: IUserRepository,
  credentialsRepository: ICredentialsRepository,
  webFingerSerializer: IWebFingerSerializer,
) {
  return new GetWebFinger(
    userRepository,
    credentialsRepository,
    webFingerSerializer,
  );
}

export function createGetActor(
  userRepository: IUserRepository,
  credentialsRepository: ICredentialsRepository,
  actorSerializer: IActorSerializer,
) {
  return new GetActor(userRepository, credentialsRepository, actorSerializer);
}

export function createGetOutbox(
  postRepository: IPostRepository,
  userRepository: IUserRepository,
  likesRepository: ILikesRepository,
  announcesRepository: IAnnouncesRepository,
  noteSerializer: INoteSerializer,
  collectionSerializer: ICollectionSerializer,
) {
  return new GetOutbox(
    postRepository,
    userRepository,
    likesRepository,
    announcesRepository,
    noteSerializer,
    collectionSerializer,
  );
}

export function createDispatchS2SActivityEvent(
  eventBus: IEventBus,
  host: string,
  protocol: string,
) {
  return new DispatchS2SActivityEvent(eventBus, host, protocol);
}

export function createDispatchC2SActivityEvent(
  eventBus: IEventBus,
  host: string,
  protocol: string,
) {
  return new DispatchC2SActivityEvent(eventBus, host, protocol);
}

export function createFanOutActivity(
  followRepository: IFollowRepository,
  federationDelivery: FederationDelivery,
  ourOrigin: string,
) {
  return new FanOutActivity(followRepository, federationDelivery, ourOrigin);
}

export function createSignatureGuard() {
  return new SignatureGuard();
}

export function createGetRemoteResource(
  httpSignatureService: HttpSignatureService,
) {
  return new GetRemoteResource(httpSignatureService);
}

export function createResolveNoteAuthorActor(
  getPostByNoteId: IGetPostByNoteId,
  ourOrigin: string,
) {
  return new ResolveNoteAuthorActor(getPostByNoteId, ourOrigin);
}

export function createActivityPubController(
  getWebFinger: IGetWebFinger,
  getActor: IGetActor,
  getOutbox: IGetOutbox,
  dispatchS2SActivityEvent: IDispatchS2SActivityEvent,
  dispatchC2SActivityEvent: IDispatchC2SActivityEvent,
  host: string,
  protocol: string,
  domain: string,
) {
  return new ActivityPubController(
    getWebFinger,
    getActor,
    getOutbox,
    dispatchS2SActivityEvent,
    dispatchC2SActivityEvent,
    host,
    protocol,
    domain,
  );
}

export function createActivityPubRoutes(
  getWebFinger: IGetWebFinger,
  getActor: IGetActor,
  getOutbox: IGetOutbox,
  dispatchS2SActivityEvent: IDispatchS2SActivityEvent,
  dispatchC2SActivityEvent: IDispatchC2SActivityEvent,
  host: string,
  protocol: string,
  domain: string,
  postOutboxAuthMiddleware?: AuthMiddleware,
) {
  return createActivityPubRoutesFactory(
    getWebFinger,
    getActor,
    getOutbox,
    dispatchS2SActivityEvent,
    dispatchC2SActivityEvent,
    host,
    protocol,
    domain,
    postOutboxAuthMiddleware,
  );
}
