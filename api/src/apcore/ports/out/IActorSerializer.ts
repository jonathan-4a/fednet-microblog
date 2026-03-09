// src/apcore/ports/out/IActorSerializer.ts

export interface ActorDocument {
  "@context": string | (string | Record<string, string>)[];
  id: string;
  type: string;
  preferredUsername: string;
  name: string;
  summary: string;
  inbox: string;
  outbox: string;
  followers: string;
  following: string;
  liked: string;
  publicKey: {
    id: string;
    owner: string;
    publicKeyPem: string;
  };
  published?: string;
  [key: string]: unknown;
}

export interface IActorSerializer {
  create(
    username: string,
    host: string,
    publicKey: string,
    name?: string,
    summary?: string,
    protocol?: string,
    published?: string,
  ): ActorDocument;
}
