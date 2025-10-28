// src/posts/posts.di.ts

import type { Kysely } from "kysely";
import type { IIdGenerator, IEventBus } from "@shared";
import type {
  INoteSerializer,
  ICollectionSerializer,
  IActivitySerializer,
} from "@apcore";
import { createUserRepository } from "@users";
import { CreatePost } from "./usecases/CreatePost";
import { GetPost } from "./usecases/GetPost";
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

const asUnknown = <T>(db: Kysely<T>) => db as Kysely<unknown>;

// Factories - accept generic Kysely<T> for cross-module full DB

export function createPostRepository<
  T extends { posts: PostsTable },
>(db: Kysely<T>) {
  return new PostRepository<T>(db as Kysely<T>);
}

export function createLikesRepository<
  T extends { likes: LikesTable },
>(db: Kysely<T>) {
  return new LikesRepository<T>(db as Kysely<T>);
}

export function createAnnouncesRepository<
  T extends { announces: AnnouncesTable },
>(db: Kysely<T>) {
  return new AnnouncesRepository<T>(db as Kysely<T>);
}

export function createGetLiked<
  T extends { likes: LikesTable; users: import("@users").UsersTable },
>(db: Kysely<T>, collectionSerializer: ICollectionSerializer) {
  const likesRepository = createLikesRepository(db);
  const userRepository = createUserRepository(db);
  return new GetLiked(likesRepository, userRepository, collectionSerializer);
}

export function createCreatePost<
  T extends { posts: PostsTable; users: import("@users").UsersTable },
>(
  db: Kysely<T>,
  idGenerator: IIdGenerator,
  eventBus: IEventBus,
  noteSerializer: INoteSerializer,
  activitySerializer: IActivitySerializer,
) {
  const postRepository = createPostRepository(db);
  const userRepository = createUserRepository(db);
  return new CreatePost(
    postRepository,
    userRepository,
    idGenerator,
    eventBus,
    noteSerializer,
    activitySerializer,
  );
}

export function createGetPost<
  T extends {
    posts: PostsTable;
    likes: LikesTable;
    announces: AnnouncesTable;
  },
>(db: Kysely<T>, noteSerializer: INoteSerializer) {
  const postRepository = createPostRepository(db);
  const likesRepository = createLikesRepository(db);
  const announcesRepository = createAnnouncesRepository(db);
  return new GetPost(
    postRepository,
    likesRepository,
    announcesRepository,
    noteSerializer,
  );
}

export function createGetPostReplies<T extends { posts: PostsTable }>(
  db: Kysely<T>,
  collectionSerializer: ICollectionSerializer,
) {
  const postRepository = createPostRepository(db);
  return new GetPostReplies(postRepository, collectionSerializer);
}

export function createGetPostLikes<
  T extends { posts: PostsTable; likes: LikesTable },
>(db: Kysely<T>, collectionSerializer: ICollectionSerializer) {
  const postRepository = createPostRepository(db);
  const likesRepository = createLikesRepository(db);
  return new GetPostLikes(
    postRepository,
    likesRepository,
    collectionSerializer,
  );
}

export function createGetPostShares<
  T extends { posts: PostsTable; announces: AnnouncesTable },
>(db: Kysely<T>, collectionSerializer: ICollectionSerializer) {
  const postRepository = createPostRepository(db);
  const announcesRepository = createAnnouncesRepository(db);
  return new GetPostShares(
    postRepository,
    announcesRepository,
    collectionSerializer,
  );
}

export function createUpdatePost<T extends { posts: PostsTable }>(
  db: Kysely<T>,
) {
  const postRepository = createPostRepository(db);
  return new UpdatePost(postRepository);
}

export function createDeletePost<T extends { posts: PostsTable }>(
  db: Kysely<T>,
) {
  const postRepository = createPostRepository(db);
  return new DeletePost(postRepository);
}

export function createPostsController<
  T extends {
    posts: PostsTable;
    likes: LikesTable;
    announces: AnnouncesTable;
  },
>(
  db: Kysely<T>,
  idGenerator: IIdGenerator,
  eventBus: IEventBus,
  noteSerializer: INoteSerializer,
  collectionSerializer: ICollectionSerializer,
  activitySerializer: IActivitySerializer,
) {
  const getPost = createGetPost(db, noteSerializer);
  const getPostReplies = createGetPostReplies(db, collectionSerializer);
  const getPostLikes = createGetPostLikes(db, collectionSerializer);
  const getPostShares = createGetPostShares(db, collectionSerializer);
  const updatePost = createUpdatePost(db);
  const deletePost = createDeletePost(db);

  return new PostsController(
    getPost,
    getPostReplies,
    getPostLikes,
    getPostShares,
    updatePost,
    deletePost,
  );
}

export function createPostsRoutes<
  T extends {
    posts: PostsTable;
    likes: LikesTable;
    announces: AnnouncesTable;
  },
>(
  db: Kysely<T>,
  noteSerializer: INoteSerializer,
  collectionSerializer: ICollectionSerializer,
  activitySerializer: IActivitySerializer,
) {
  const getPost = createGetPost(db, noteSerializer);
  const getPostReplies = createGetPostReplies(db, collectionSerializer);
  const getPostLikes = createGetPostLikes(db, collectionSerializer);
  const getPostShares = createGetPostShares(db, collectionSerializer);
  const updatePost = createUpdatePost(db);
  const deletePost = createDeletePost(db);

  return createPostsRoutesFactory(
    getPost,
    getPostReplies,
    getPostLikes,
    getPostShares,
    updatePost,
    deletePost,
  );
}

