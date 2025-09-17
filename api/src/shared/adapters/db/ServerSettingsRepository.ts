// src/shared/adapters/db/repository/ServerSettingsRepository.ts
import type { Kysely } from "kysely";
import type { ServerSettingsTable } from "./ServerSettingsSchema";
import type { ServerSettings } from "../../domain/ServerSettings";
import type { IServerSettingsRepository } from "../../ports/out/IServerSettingsRepository";

const SETTINGS_ROW_ID = "singleton";

export class ServerSettingsRepository<
  DB extends { server_settings: ServerSettingsTable } = {
    server_settings: ServerSettingsTable;
  },
> implements IServerSettingsRepository {
  private readonly db: Kysely<{ server_settings: ServerSettingsTable }>;

  constructor(db: Kysely<DB>) {
    this.db = db as unknown as Kysely<{
      server_settings: ServerSettingsTable;
    }>;
  }

  async getSettings(): Promise<ServerSettings | null> {
    const row = await this.db
      .selectFrom("server_settings")
      .selectAll()
      .where("id", "=", SETTINGS_ROW_ID)
      .executeTakeFirst();

    return row
      ? {
          registration_mode:
            row.registration_mode as ServerSettings["registration_mode"],
          allow_public_peers: row.allow_public_peers === 1,
          auto_fetch_peer_links: row.auto_fetch_peer_links === 1,
        }
      : null;
  }

  async saveSettings(settings: ServerSettings): Promise<ServerSettings> {
    await this.db
      .insertInto("server_settings")
      .values({
        id: SETTINGS_ROW_ID,
        registration_mode: settings.registration_mode,
        allow_public_peers: settings.allow_public_peers ? 1 : 0,
        auto_fetch_peer_links: settings.auto_fetch_peer_links ? 1 : 0,
        updated_at: Math.floor(Date.now() / 1000),
      })
      .onConflict((oc) =>
        oc.column("id").doUpdateSet({
          registration_mode: settings.registration_mode,
          allow_public_peers: settings.allow_public_peers ? 1 : 0,
          auto_fetch_peer_links: settings.auto_fetch_peer_links ? 1 : 0,
          updated_at: Math.floor(Date.now() / 1000),
        }),
      )
      .execute();

    return settings;
  }
}

