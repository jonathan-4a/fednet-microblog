// src/apcore/ports/in/ActivityPub.dto.ts

export interface ActivityPubObjectOutput {
  "@context": string | (string | Record<string, string>)[];
  id: string;
  type: string;
  [key: string]: any;
}

export interface NoteOutput extends ActivityPubObjectOutput {
  type: "Note";
  published: string;
  attributedTo: string;
  content: string;
  to?: string[];
  cc?: string[];
  inReplyTo?: string | null;
  replies?: OrderedCollectionOutput;
  likes?: OrderedCollectionOutput;
  shares?: OrderedCollectionOutput;
}

export interface ActorOutput extends ActivityPubObjectOutput {
  type: "Person" | "Service" | "Application" | "Group" | "Organization";
  preferredUsername: string;
  inbox: string;
  outbox: string;
  followers?: string;
  following?: string;
  liked?: string;
  publicKey?: {
    id: string;
    owner: string;
    publicKeyPem: string;
  };
  icon?: {
    type: "Image";
    url: string;
  };
}

export interface OrderedCollectionOutput extends ActivityPubObjectOutput {
  type: "OrderedCollection";
  totalItems: number;
  first?: string | OrderedCollectionPageOutput;
  last?: string;
  items?: string[];
}

export interface OrderedCollectionPageOutput extends ActivityPubObjectOutput {
  type: "OrderedCollectionPage";
  partOf: string;
  orderedItems: any[];
  next?: string;
  prev?: string;
}

export interface ActivityOutput extends ActivityPubObjectOutput {
  actor: string | ActorOutput;
  object: string | ActivityPubObjectOutput;
  published?: string;
}

export interface WebFingerResponse {
  subject: string;
  links: Array<{
    rel: string;
    type: string;
    href: string;
  }>;
}

export interface GetWebFingerInput {
  resource: string;
  domain: string;
  protocol: string;
}

export interface GetRemoteResourceInput {
  url: string;
  acceptHeader?: string;
  signAsUsername?: string;
  /** When true, return raw response (status, body, contentType) for proxy forwarding; no throw on 4xx/5xx */
  raw?: boolean;
}

export interface GetOutboxInput {
  username: string;
  host: string;
  protocol: string;
  page?: number;
  limit?: number;
}

export interface GetActorInput {
  username: string;
  host: string;
  protocol: string;
}

export interface DispatchC2SActivityEventInput {
  username: string;
  activity: Record<string, unknown>;
  responseCallback?: (error?: Error) => void;
}

export interface DispatchS2SActivityEventInput {
  username: string;
  activity: Record<string, unknown>;
}
