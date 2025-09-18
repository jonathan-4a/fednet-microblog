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

export function createTransactionManager<T>(db: Kysely<T>) {
  return new TransactionManagerService(db);
}

export function createIdGenerator() {
  return new IdGenerator();
}

export function createEventBus() {
  return new EventBus(createLogger("shared"));
}

export function createGetServerSettings<
  T extends { server_settings: ServerSettingsTable },
>(db: Kysely<T>) {
  const repository = new ServerSettingsRepository<T>(
    db as unknown as Kysely<T>,
  );
  return new GetServerSettings(repository);
}

export function createUpdateServerSettings<
  T extends { server_settings: ServerSettingsTable },
>(db: Kysely<T>) {
  const repository = new ServerSettingsRepository<T>(
    db as unknown as Kysely<T>,
  );
  const getSettings = createGetServerSettings(db);
  return new UpdateServerSettings(repository, getSettings);
}

export function createAppRoutes<
  T extends { server_settings: ServerSettingsTable },
>(
  db: Kysely<T>,
  proxyAuthMiddleware?: AuthMiddleware,
  getRemoteResource?: IGetRemoteResource,
) {
  const getSettings = createGetServerSettings(db);
  return createAppRoutesFactory(
    getSettings,
    proxyAuthMiddleware,
    getRemoteResource,
  );
}

