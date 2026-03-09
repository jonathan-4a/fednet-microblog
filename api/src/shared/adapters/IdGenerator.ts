// src/shared/adapters/IdGenerator.ts

import { randomUUID } from "crypto";
import type { IIdGenerator } from "../ports/out/IIdGenerator";

export class IdGenerator implements IIdGenerator {
  generate(): string {
    return randomUUID();
  }
}
