// src/posts/ports/in/Posts.dto.ts

export interface UpdatePostRequestDto {
  content: string;
}
export interface CreatePostInput {
  username: string;
  content: string;
  inReplyTo?: string | null;
  host: string;
  protocol: string;
  actor?: string;
  noteId?: string;
  guid?: string;
}

export interface CreatePostOutput {
  guid: string;
  createdAt: number;
  note: Record<string, unknown>;
  createActivity: Record<string, unknown>;
}

export interface DeletePostInput {
  guid: string;
  username: string;
}

export interface GetLikedInput {
  username: string;
  host: string;
  protocol: string;
}

export interface GetPostInput {
  guid: string;
  username: string;
  host: string;
  protocol: string;
}

export interface GetPostLikesInput {
  guid: string;
  username: string;
  host: string;
  protocol: string;
  page?: number;
  limit?: number;
}

export interface GetPostRepliesInput {
  guid: string;
  username: string;
  host: string;
  protocol: string;
  page?: number;
  limit?: number;
}

export interface GetPostSharesInput {
  guid: string;
  username: string;
  host: string;
  protocol: string;
  page?: number;
  limit?: number;
}

export interface UpdatePostInput {
  guid: string;
  username: string;
  content: string;
}
