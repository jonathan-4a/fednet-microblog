// src/shared/ports/in/IGetServerSettings.ts

import type {
  GetServerSettingsInput,
  GetServerSettingsOutput,
} from "./ServerSettings.dto";

export interface IGetServerSettings {
  execute(input: GetServerSettingsInput): Promise<GetServerSettingsOutput>;
}

