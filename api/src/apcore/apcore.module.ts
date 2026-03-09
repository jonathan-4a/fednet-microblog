// src/apcore/apcore.module.ts

// Export use case classes
export { GetWebFinger } from "./usecases/GetWebFinger";
export { GetActor } from "./usecases/GetActor";
export { GetOutbox } from "./usecases/GetOutbox";
export { GetRemoteResource } from "./usecases/GetRemoteResource";
export { DispatchS2SActivityEvent } from "./usecases/DispatchS2SActivityEvent";
export { DispatchC2SActivityEvent } from "./usecases/DispatchC2SActivityEvent";
export { FanOutActivity } from "./usecases/FanOutActivity";

// Export serializer implementations (for DI in other modules)
export { Actor } from "./adapters/serializers/Actor";
export { Note } from "./adapters/serializers/Note";
export { Collection } from "./adapters/serializers/Collection";
export { WebFinger } from "./adapters/serializers/WebFinger";
export { Activity } from "./adapters/serializers/Activity";

// Export adapters
export { ActivityPubController } from "./adapters/http/ActivityPubController";
export { HttpSignatureService } from "./adapters/http/HttpSignatureService";
export { FederationDelivery } from "./adapters/http/FederationDelivery";
export { SignatureGuard } from "./adapters/http/SignatureGuard";

// Export handlers (event handlers, not HTTP)
export { HandleC2SFollowActivity } from "./handlers/HandleC2SFollowActivity";
export { HandleC2SCreateActivity } from "./handlers/HandleC2SCreateActivity";
export { HandleC2SAnnounceActivity } from "./handlers/HandleC2SAnnounceActivity";
export { HandleC2SLikeActivity } from "./handlers/HandleC2SLikeActivity";
export { HandleS2SFollowActivity } from "./handlers/HandleS2SFollowActivity";
export { HandleS2SCreateActivity } from "./handlers/HandleS2SCreateActivity";
export { HandleS2SAnnounceActivity } from "./handlers/HandleS2SAnnounceActivity";
export { HandleS2SLikeActivity } from "./handlers/HandleS2SLikeActivity";
export { HandlePostCreated } from "./handlers/HandlePostCreated";

// Export factory functions from di.ts
export {
  createGetWebFinger,
  createGetActor,
  createGetOutbox,
  createGetRemoteResource,
  createResolveNoteAuthorActor,
  createDispatchS2SActivityEvent,
  createDispatchC2SActivityEvent,
  createFanOutActivity,
  createSignatureGuard,
  createActivityPubController,
  createActivityPubRoutes,
} from "./apcore.di";

// Export types (in ports)
export type { IGetWebFinger } from "./ports/in/IGetWebFinger";
export type { IGetActor } from "./ports/in/IGetActor";
export type { IGetOutbox } from "./ports/in/IGetOutbox";
export type { IGetRemoteResource } from "./ports/in/IGetRemoteResource";
export type { GetRemoteResourceRawResult } from "./ports/in/IGetRemoteResource";
export type { IFanOutActivity } from "./ports/in/IFanOutActivity";

// Export types (out ports – serializers)
export type {
  IActorSerializer,
  ActorDocument,
} from "./ports/out/IActorSerializer";
export type { INoteSerializer } from "./ports/out/INoteSerializer";
export type { ICollectionSerializer } from "./ports/out/ICollectionSerializer";
export type { IActivitySerializer } from "./ports/out/IActivitySerializer";
export type {
  IWebFingerSerializer,
  WebFingerDocument,
} from "./ports/out/IWebFingerSerializer";
export type { IResolveNoteAuthorActor } from "./ports/out/IResolveNoteAuthorActor";
export type { INotificationActivityEmitter } from "./ports/out/INotificationActivityEmitter";
export type {
  NoteOutput,
  OrderedCollectionOutput,
  OrderedCollectionPageOutput,
} from "./ports/in/ActivityPub.dto";
export { InternalServerError } from "./domain/ActivityPubErrors";
export type { C2SActivitySubmittedEvent } from "./domain/events/C2SActivitySubmittedEvent";
export type { ActivityReceivedEvent } from "./domain/events/ActivityReceivedEvent";
