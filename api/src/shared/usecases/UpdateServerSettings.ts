// src/shared/usecases/UpdateServerSettings.ts
import type { IUpdateServerSettings } from "../ports/in/IUpdateServerSettings";
import type { IServerSettingsRepository } from "../ports/out/IServerSettingsRepository";
import type { IGetServerSettings } from "../ports/in/IGetServerSettings";
import type {
  UpdateServerSettingsInput,
  UpdateServerSettingsOutput,
} from "../ports/in/ServerSettings.dto";
import type { ServerSettings } from "../domain/ServerSettings";

export class UpdateServerSettings implements IUpdateServerSettings {
  constructor(
    private readonly serverSettingsRepository: IServerSettingsRepository,
    private readonly getServerSettings: IGetServerSettings,
  ) {}

  async execute(
    input: UpdateServerSettingsInput,
  ): Promise<UpdateServerSettingsOutput> {
    console.log("Update Settings Input: ", input);

    if (
      input.registration_mode &&
      !["open", "invite"].includes(input.registration_mode)
    ) {
      throw new Error('registration_mode must be either "open" or "invite"');
    }

    const current: ServerSettings = await this.getServerSettings.execute({});

    const merged: ServerSettings = {
      ...current,
      ...input,
      registration_mode:
        (input.registration_mode as ServerSettings["registration_mode"]) ??
        current.registration_mode,
    };

    return await this.serverSettingsRepository.saveSettings(merged);
  }
}

