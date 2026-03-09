// src/posts/ports/in/IGetPostLikes.ts

import type { GetPostLikesInput } from "./Posts.dto";

export interface IGetPostLikes {
  execute(input: GetPostLikesInput): Promise<Record<string, unknown>>;
}
