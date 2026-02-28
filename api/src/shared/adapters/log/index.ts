// src/shared/adapters/log/index.ts

import path from "path";
import type { ILogger } from "@shared/ports/out/ILogger";

export function createLogger(
  filename: string,
  _env?: string,
  _logPath?: string,
): ILogger {
  void _env;
  void _logPath;

  const context = path.basename(filename, path.extname(filename));

  return {
    info(message: string, ...meta: unknown[]) {
      console.info(`[${context}] ${message}`, ...meta);
    },
    error(message: string, trace?: string, ...meta: unknown[]) {
      if (trace) {
        console.error(`[${context}] ${message}\n${trace}`, ...meta);
      } else {
        console.error(`[${context}] ${message}`, ...meta);
      }
    },
    warn(message: string, ...meta: unknown[]) {
      console.warn(`[${context}] ${message}`, ...meta);
    },
  };
}

// Default logger instance
export const logger: ILogger = {
  info(message: string, ...meta: unknown[]) {
    console.info(message, ...meta);
  },
  error(message: string, trace?: string, ...meta: unknown[]) {
    if (trace) {
      console.error(`${message}\n${trace}`, ...meta);
    } else {
      console.error(message, ...meta);
    }
  },
  warn(message: string, ...meta: unknown[]) {
    console.warn(message, ...meta);
  },
};

export function createRequestLogger(_env?: string, _logPath?: string) {
  void _env;
  void _logPath;

  return (req: Request) => {
    const start = process.hrtime.bigint();
    const { method } = req;
    const { pathname } = new URL(req.url);

    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;

    console.log(`[HTTP] ${method} ${pathname} ${durationMs.toFixed(2)}ms`);
  };
}


