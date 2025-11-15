// src/admin/ports/in/IGetServerSettings.ts

import type { ServerSettings } from "@shared";

export type AdminServerSettings = ServerSettings;

export interface IGetServerSettings {
  execute(): Promise<AdminServerSettings>;
}

