// src/shared/usecases/GetServerSettings.ts

import type { IGetServerSettings } from "../ports/in/IGetServerSettings";
import type { IServerSettingsRepository } from "../ports/out/IServerSettingsRepository";
import type { GetServerSettingsOutput } from "../ports/in/ServerSettings.dto";
import type { ServerSettings } from "../domain/ServerSettings";

export class GetServerSettings implements IGetServerSettings {
  constructor(
    private readonly serverSettingsRepository: IServerSettingsRepository,
  ) {}

  async execute(): Promise<GetServerSettingsOutput> {
    const stored = await this.serverSettingsRepository.getSettings();

    if (stored) {
      return stored;
    }

    const defaults = this.buildDefaultSettings();
    await this.serverSettingsRepository.saveSettings(defaults);

    return defaults;
  }

  private buildDefaultSettings(): ServerSettings {
    return {
      registration_mode: this.resolveRegistrationMode(
        process.env.REGISTRATION_MODE,
      ),
      allow_public_peers: this.resolveBoolean(
        process.env.ALLOW_PUBLIC_PEERS,
        true,
      ),
      auto_fetch_peer_links: this.resolveBoolean(
        process.env.AUTO_FETCH_PEER_LINKS,
        false,
      ),
    };
  }

  private resolveRegistrationMode(value?: string | null): "open" | "invite" {
    if (!value) return "open";
    return value.toLowerCase() === "invite" ? "invite" : "open";
  }

  private resolveBoolean(
    rawValue: string | undefined | null,
    defaultValue: boolean,
  ): boolean {
    if (rawValue === undefined || rawValue === null) return defaultValue;
    return rawValue.toLowerCase() === "true";
  }
}

