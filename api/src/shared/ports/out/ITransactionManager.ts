// src/shared/ports/out/ITransactionManager.ts

export interface ITransactionManager {
  execute<T>(callback: (trx: unknown) => Promise<T>): Promise<T>;
}

