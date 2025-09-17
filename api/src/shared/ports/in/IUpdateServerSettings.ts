// src/shared/ports/in/IUpdateServerSettings.ts

import type {
  UpdateServerSettingsInput,
  UpdateServerSettingsOutput,
} from "./ServerSettings.dto";

export interface IUpdateServerSettings {
  execute(
    input: UpdateServerSettingsInput,
  ): Promise<UpdateServerSettingsOutput>;
}

