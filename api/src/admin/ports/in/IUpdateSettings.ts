// src/admin/ports/in/IUpdateSettings.ts

import type { AdminServerSettings } from "./IGetServerSettings";
import type { UpdateSettingsInput } from "./Admin.dto";

export interface IUpdateSettings {
  execute(input: UpdateSettingsInput): Promise<AdminServerSettings>;
}

