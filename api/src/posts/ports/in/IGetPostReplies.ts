// src/posts/ports/in/IGetPostReplies.ts

import type { GetPostRepliesInput } from "./Posts.dto";

export interface IGetPostReplies {
  execute(input: GetPostRepliesInput): Promise<Record<string, unknown>>;
}
