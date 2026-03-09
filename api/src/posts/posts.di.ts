// src/posts/posts.di.ts
import type { Kysely } from "kysely";
import type { IIdGenerator, IEventBus } from "@shared";
import type {
  INoteSerializer,
  ICollectionSerializer,
  IActivitySerializer,
} from "@apcore";
import type { IUserRepository } from "@users";
import { CreatePost } from "./usecases/CreatePost";
import { GetPost } from "./usecases/GetPost";
import { GetPostByNoteId } from "./usecases/GetPostByNoteId";
import { GetPostReplies } from "./usecases/GetPostReplies";
import { GetPostLikes } from "./usecases/GetPostLikes";
import { GetPostShares } from "./usecases/GetPostShares";
import { UpdatePost } from "./usecases/UpdatePost";
import { DeletePost } from "./usecases/DeletePost";
import { GetLiked } from "./usecases/GetLiked";
import { PostRepository } from "./adapters/db/repository/PostRepository";
import { LikesRepository } from "./adapters/db/repository/LikesRepository";
import { AnnouncesRepository } from "./adapters/db/repository/AnnouncesRepository";
import { PostsController } from "./adapters/http/PostsController";
import { createPostsRoutes as createPostsRoutesFactory } from "./adapters/http/PostsRoutes";
import type { PostsTable } from "./adapters/db/models/PostSchema";
import type { LikesTable } from "./adapters/db/models/LikesSchema";
import type { AnnouncesTable } from "./adapters/db/models/AnnouncesSchema";
import type { IPostRepository } from "./ports/out/IPostRepository";
import type { ILikesRepository } from "./ports/out/ILikesRepository";
import type { IAnnouncesRepository } from "./ports/out/IAnnouncesRepository";

export function createPostRepository(
  db: Kysely<{ posts: PostsTable }>,
): PostRepository {
  return new PostRepository(db);
}

export function createLikesRepository(
  db: Kysely<{ likes: LikesTable }>,
): LikesRepository {
  return new LikesRepository(db);
}

export function createAnnouncesRepository(
  db: Kysely<{ announces: AnnouncesTable }>,
): AnnouncesRepository {
  return new AnnouncesRepository(db);
}

export function createGetLiked(
  likesRepository: ILikesRepository,
  userRepository: IUserRepository,
  collectionSerializer: ICollectionSerializer,
) {
  return new GetLiked(likesRepository, userRepository, collectionSerializer);
}

export function createCreatePost(
  postRepository: IPostRepository,
  userRepository: IUserRepository,
  idGenerator: IIdGenerator,
  eventBus: IEventBus,
  noteSerializer: INoteSerializer,
  activitySerializer: IActivitySerializer,
) {
  return new CreatePost(
    postRepository,
    userRepository,
    idGenerator,
    eventBus,
    noteSerializer,
    activitySerializer,
  );
}

export function createGetPost(
  postRepository: IPostRepository,
  likesRepository: ILikesRepository,
  announcesRepository: IAnnouncesRepository,
  noteSerializer: INoteSerializer,
) {
  return new GetPost(
    postRepository,
    likesRepository,
    announcesRepository,
    noteSerializer,
  );
}

export function createGetPostByNoteId(
  postRepository: IPostRepository,
  ourOrigin: string,
) {
  return new GetPostByNoteId(postRepository, ourOrigin);
}

export function createGetPostReplies(
  postRepository: IPostRepository,
  collectionSerializer: ICollectionSerializer,
) {
  return new GetPostReplies(postRepository, collectionSerializer);
}

export function createGetPostLikes(
  postRepository: IPostRepository,
  likesRepository: ILikesRepository,
  collectionSerializer: ICollectionSerializer,
) {
  return new GetPostLikes(
    postRepository,
    likesRepository,
    collectionSerializer,
  );
}

export function createGetPostShares(
  postRepository: IPostRepository,
  announcesRepository: IAnnouncesRepository,
  collectionSerializer: ICollectionSerializer,
) {
  return new GetPostShares(
    postRepository,
    announcesRepository,
    collectionSerializer,
  );
}

export function createUpdatePost(postRepository: IPostRepository) {
  return new UpdatePost(postRepository);
}

export function createDeletePost(postRepository: IPostRepository) {
  return new DeletePost(postRepository);
}

export function createPostsController(
  postRepository: IPostRepository,
  likesRepository: ILikesRepository,
  announcesRepository: IAnnouncesRepository,
  idGenerator: IIdGenerator,
  eventBus: IEventBus,
  noteSerializer: INoteSerializer,
  collectionSerializer: ICollectionSerializer,
) {
  const getPost = createGetPost(
    postRepository,
    likesRepository,
    announcesRepository,
    noteSerializer,
  );
  const getPostReplies = createGetPostReplies(
    postRepository,
    collectionSerializer,
  );
  const getPostLikes = createGetPostLikes(
    postRepository,
    likesRepository,
    collectionSerializer,
  );
  const getPostShares = createGetPostShares(
    postRepository,
    announcesRepository,
    collectionSerializer,
  );
  const updatePost = createUpdatePost(postRepository);
  const deletePost = createDeletePost(postRepository);

  return new PostsController(
    getPost,
    getPostByNoteId,
    getPostReplies,
    getPostLikes,
    getPostShares,
    getPostShares,
    updatePost,
    deletePost,
  );
}

export function createPostsRoutes(
  postRepository: IPostRepository,
  likesRepository: ILikesRepository,
  announcesRepository: IAnnouncesRepository,
  noteSerializer: INoteSerializer,
  collectionSerializer: ICollectionSerializer,
  activitySerializer: IActivitySerializer,
  host: string,
  protocol: string,
  authMiddleware?: (
    c: unknown,
    next: () => Promise<void>,
  ) => Promise<Response | void>,
) {
  const getPost = createGetPost(
    postRepository,
    likesRepository,
    announcesRepository,
    noteSerializer,
  );
  const getPostReplies = createGetPostReplies(
    postRepository,
    collectionSerializer,
  );
  const getPostLikes = createGetPostLikes(
    postRepository,
    likesRepository,
    collectionSerializer,
  );
  const getPostShares = createGetPostShares(
    postRepository,
    announcesRepository,
    collectionSerializer,
  );
  const updatePost = createUpdatePost(postRepository);
  const deletePost = createDeletePost(postRepository);

  return createPostsRoutesFactory(
    getPost,
    getPostReplies,
    getPostLikes,
    getPostShares,
    updatePost,
    deletePost,
    host,
    protocol,
    authMiddleware,
  );
}
