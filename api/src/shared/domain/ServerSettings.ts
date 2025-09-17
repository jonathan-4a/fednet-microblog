// src/shared/domain/ServerSettings.ts

export type RegistrationMode = "open" | "invite";

export interface ServerSettings {
  registration_mode: RegistrationMode;
  allow_public_peers: boolean;
  auto_fetch_peer_links: boolean;
}

