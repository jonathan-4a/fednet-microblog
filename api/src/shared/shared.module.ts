// src/shared/shared.module.ts

// Export utilities
export { createLogger } from "./adapters/log";

// Export factory functions from di.ts
export {
  createTransactionManager,
  createIdGenerator,
  createEventBus,
  createServerSettingsRepository,
  createGetServerSettings,
  createUpdateServerSettings,
  createAppRoutes,
} from "./shared.di";

export {
  createServerSettingsSchema,
  type ServerSettingsTable,
} from "./adapters/db/ServerSettingsSchema";

// Export types
export { DomainError } from "./domain/errors";
export type { IGetServerSettings } from "./ports/in/IGetServerSettings";
export type { IUpdateServerSettings } from "./ports/in/IUpdateServerSettings";
export type { ITransactionManager } from "./ports/out/ITransactionManager";
export type { IIdGenerator } from "./ports/out/IIdGenerator";
export type { IEventBus } from "./ports/out/IEventBus";
export type { ILogger } from "./ports/out/ILogger";
export type { ServerSettings } from "./domain/ServerSettings";
export type { PaginatedResponseDto } from "./ports/in/Pagination.dto";
export { BaseEvent } from "./domain/events";
