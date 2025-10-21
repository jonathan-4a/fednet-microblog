// src/posts/ports/in/IGetPostShares.ts

import type { GetPostSharesInput } from "./Posts.dto";

export interface IGetPostShares {
  execute(input: GetPostSharesInput): Promise<Record<string, unknown>>;
}

