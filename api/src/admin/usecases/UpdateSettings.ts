// src/admin/usecases/UpdateSettings.ts

import type { IUpdateSettings } from "../ports/in/IUpdateSettings";
import type { UpdateSettingsInput } from "../ports/in/Admin.dto";
import type { AdminServerSettings } from "../ports/in/IGetServerSettings";
import type { IUpdateServerSettings } from "@shared";

export class UpdateSettings implements IUpdateSettings {
  constructor(private readonly updateServerSettings: IUpdateServerSettings) {}

  async execute(input: UpdateSettingsInput): Promise<AdminServerSettings> {
    return this.updateServerSettings.execute(input);
  }
}
