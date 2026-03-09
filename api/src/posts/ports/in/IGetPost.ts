// src/posts/ports/in/IGetPost.ts

import type { GetPostInput } from "./Posts.dto";

export interface IGetPost {
  execute(input: GetPostInput): Promise<Record<string, unknown>>;
}
