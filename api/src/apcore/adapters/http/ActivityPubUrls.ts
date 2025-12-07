// src/apcore/adapters/http/ActivityPubUrls.ts

export const ActivityPubUrls = {
  webfinger: "/.well-known/webfinger",
  actor: "/u/:username",
  outbox: "/u/:username/outbox",
  inbox: "/u/:username/inbox",
  sharedInbox: "/inbox",
};

