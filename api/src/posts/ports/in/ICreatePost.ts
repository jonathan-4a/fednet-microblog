// src/posts/ports/in/ICreatePost.ts

import type { CreatePostInput, CreatePostOutput } from "./Posts.dto";

export interface ICreatePost {
  execute(input: CreatePostInput): Promise<CreatePostOutput>;
}

