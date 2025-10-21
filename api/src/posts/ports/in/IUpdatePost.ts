// src/posts/ports/in/IUpdatePost.ts

import type { UpdatePostInput } from "./Posts.dto";

export interface IUpdatePost {
  execute(input: UpdatePostInput): Promise<{ updated: boolean }>;
}

