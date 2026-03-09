// src/posts/posts.module.ts

// Export use case classes
export { CreatePost } from "./usecases/CreatePost";
export { GetPost } from "./usecases/GetPost";
export { GetPostByNoteId } from "./usecases/GetPostByNoteId";
export { GetPostReplies } from "./usecases/GetPostReplies";
export { GetPostLikes } from "./usecases/GetPostLikes";
export { GetPostShares } from "./usecases/GetPostShares";
export { UpdatePost } from "./usecases/UpdatePost";
export { DeletePost } from "./usecases/DeletePost";

// Export repositories
export { PostRepository } from "./adapters/db/repository/PostRepository";
export { LikesRepository } from "./adapters/db/repository/LikesRepository";
export { AnnouncesRepository } from "./adapters/db/repository/AnnouncesRepository";

// Export controller
export { PostsController } from "./adapters/http/PostsController";

// Export schema functions
export { createPostSchema } from "./adapters/db/models/PostSchema";
export { createAnnouncesSchema } from "./adapters/db/models/AnnouncesSchema";
export { createLikesSchema } from "./adapters/db/models/LikesSchema";

// Export factory functions from di.ts
export {
  createPostRepository,
  createLikesRepository,
  createAnnouncesRepository,
  createGetLiked,
  createCreatePost,
  createGetPost,
  createGetPostByNoteId,
  createGetPostReplies,
  createGetPostLikes,
  createGetPostShares,
  createUpdatePost,
  createDeletePost,
  createPostsController,
  createPostsRoutes,
} from "./posts.di";

// Export types
export type { ICreatePost } from "./ports/in/ICreatePost";
export type { IGetPost } from "./ports/in/IGetPost";
export type { IGetPostByNoteId } from "./ports/in/IGetPostByNoteId";
export type { IGetLiked } from "./ports/in/IGetLiked";
export type { IGetPostReplies } from "./ports/in/IGetPostReplies";
export type { IGetPostLikes } from "./ports/in/IGetPostLikes";
export type { IGetPostShares } from "./ports/in/IGetPostShares";
export type { IUpdatePost } from "./ports/in/IUpdatePost";
export type { IDeletePost } from "./ports/in/IDeletePost";
export type { PostsTable } from "./adapters/db/models/PostSchema";
export type { AnnouncesTable } from "./adapters/db/models/AnnouncesSchema";
export type { LikesTable } from "./adapters/db/models/LikesSchema";
export type { IPostRepository, PostRecord } from "./ports/out/IPostRepository";
export { PostCreatedEvent } from "./domain/events";
export type { ILikesRepository } from "./ports/out/ILikesRepository";
export type {
  IAnnouncesRepository,
  AnnouncedRecord,
} from "./ports/out/IAnnouncesRepository";
