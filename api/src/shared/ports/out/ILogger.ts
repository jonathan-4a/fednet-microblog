// src/shared/ports/out/ILogger.ts

export interface ILogger {
  info(message: string, ...meta: unknown[]): void;
  error(message: string, trace?: string, ...meta: unknown[]): void;
  warn(message: string, ...meta: unknown[]): void;
}
