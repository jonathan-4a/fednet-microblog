// src/posts/ports/in/IDeletePost.ts

import type { DeletePostInput } from "./Posts.dto";

export interface IDeletePost {
  execute(input: DeletePostInput): Promise<{ deleted: boolean }>;
}
