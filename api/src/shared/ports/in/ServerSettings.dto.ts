// src/shared/ports/in/ServerSettings.dto.ts

import type { ServerSettings } from "../../domain/ServerSettings";

export type GetServerSettingsInput = Record<string, never>;

export type GetServerSettingsOutput = ServerSettings;

export interface UpdateServerSettingsInput {
  registration_mode?: string;
  allow_public_peers?: boolean;
  auto_fetch_peer_links?: boolean;
}

export type UpdateServerSettingsOutput = ServerSettings;
