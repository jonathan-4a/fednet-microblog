// src/posts/ports/in/IGetLiked.ts

import type { GetLikedInput } from "./Posts.dto";

export interface IGetLiked {
  execute(input: GetLikedInput): Promise<Record<string, unknown>>;
}

