// src/shared/adapters/db/KyselyTransactionManager.ts

import type { Kysely } from "kysely";
import type { ITransactionManager } from "../../ports/out/ITransactionManager";

export class TransactionManagerService implements ITransactionManager {
  constructor(private readonly db: Kysely<any>) {}

  async execute<T>(callback: (trx: unknown) => Promise<T>): Promise<T> {
    return await this.db.transaction().execute(async (trx) => {
      return await callback(trx);
    });
  }
}
