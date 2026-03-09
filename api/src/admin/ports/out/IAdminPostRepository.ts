// src/admin/ports/out/IAdminPostRepository.ts

export interface AdminPostRecord {
  guid: string;
  author_username: string;
  content: string;
  in_reply_to: string | null;
  is_deleted: number;
  created_at: number;
  updated_at: number | null;
  deleted_at: number | null;
}

export interface PostsPaginationParams {
  page?: number;
  limit?: number;
  authorUsername?: string;
}

export interface PaginatedPosts {
  posts: AdminPostRecord[];
  total: number;
  page: number;
  limit: number;
}

export interface IAdminPostRepository {
  countAll(): Promise<number>;
  countByAuthor(username: string): Promise<number>;
  findRecentByAuthor(
    username: string,
    limit: number,
  ): Promise<AdminPostRecord[]>;
  paginate(params: PostsPaginationParams): Promise<PaginatedPosts>;
  findByGuid(guid: string): Promise<AdminPostRecord | undefined>;
  deleteByGuid(guid: string): Promise<number>;
  updateByGuid(
    guid: string,
    updates: Partial<Pick<AdminPostRecord, "content" | "is_deleted">>,
  ): Promise<number>;
}
