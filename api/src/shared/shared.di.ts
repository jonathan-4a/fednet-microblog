// src/shared/shared.di.ts
import { TransactionManagerService } from "./adapters/db/KyselyTransactionManager";
import { IdGenerator } from "./adapters/IdGenerator";
import { ServerSettingsRepository } from "./adapters/db/ServerSettingsRepository";
import { EventBus } from "./adapters/events/EventBus";
import { createLogger } from "./adapters/log";
import { GetServerSettings } from "./usecases/GetServerSettings";
import { UpdateServerSettings } from "./usecases/UpdateServerSettings";
import {
  createAppRoutes as createAppRoutesFactory,
  type AuthMiddleware,
} from "./adapters/http/AppRoutes";
import type { IGetRemoteResource } from "@apcore";
import type { Kysely } from "kysely";
import type { ServerSettingsTable } from "./adapters/db/ServerSettingsSchema";
import type { IServerSettingsRepository } from "./ports/out/IServerSettingsRepository";
import type { IGetServerSettings } from "./ports/in/IGetServerSettings";

export function createTransactionManager<T>(db: Kysely<T>) {
  return new TransactionManagerService(db);
}

export function createIdGenerator() {
  return new IdGenerator();
}

export function createEventBus() {
  return new EventBus(createLogger("shared"));
}

export function createServerSettingsRepository(
  db: Kysely<{ server_settings: ServerSettingsTable }>,
): ServerSettingsRepository {
  return new ServerSettingsRepository(db);
}

export function createGetServerSettings(
  serverSettingsRepository: IServerSettingsRepository,
) {
  return new GetServerSettings(serverSettingsRepository);
}

export function createUpdateServerSettings(
  serverSettingsRepository: IServerSettingsRepository,
  getServerSettings: IGetServerSettings,
) {
  return new UpdateServerSettings(serverSettingsRepository, getServerSettings);
}

export function createAppRoutes(
  getServerSettings: IGetServerSettings,
  protocol: string,
  domain: string,
  port: string,
  proxyAuthMiddleware?: AuthMiddleware,
  getRemoteResource?: IGetRemoteResource,
) {
  return createAppRoutesFactory(
    getServerSettings,
    protocol,
    domain,
    port,
    proxyAuthMiddleware,
    getRemoteResource,
  );
}
