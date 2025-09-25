// src/auth/ports/out/repository/ICredentialsRepository.ts

import type { Credentials } from "../../../domain/Credentials";

// Transaction abstraction for repository operations
export type Transaction = unknown;

export interface ICredentialsRepository {
  findCredentialsByUsername(username: string): Promise<Credentials | undefined>;
  createCredentials(trx: Transaction, credentials: Credentials): Promise<void>;
}

