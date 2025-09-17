// src/shared/ports/out/IServerSettingsRepository.ts

import type { ServerSettings } from "../../domain/ServerSettings";

export interface IServerSettingsRepository {
  getSettings(): Promise<ServerSettings | null>;
  saveSettings(settings: ServerSettings): Promise<ServerSettings>;
}

