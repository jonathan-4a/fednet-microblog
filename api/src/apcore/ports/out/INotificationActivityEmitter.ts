// src/apcore/ports/out/INotificationActivityEmitter.ts
export interface INotificationActivityEmitter {
  onFollowDone(recipientActor: string, actor: string): void | Promise<void>;
  onLikeDone(
    recipientActor: string,
    actor: string,
    objectId: string,
  ): void | Promise<void>;
  onRepostDone(
    recipientActor: string,
    actor: string,
    objectId: string,
  ): void | Promise<void>;
  onReplyDone(
    recipientActor: string,
    actor: string,
    objectId: string | null,
  ): void | Promise<void>;
}
