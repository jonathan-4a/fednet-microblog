// src/posts/adapters/http/PostsUrls.ts

export const PostsUrls = {
  userStatus: "/u/:username/statuses/:id",
  userStatusReplies: "/u/:username/statuses/:id/replies",
  userStatusLikes: "/u/:username/statuses/:id/likes",
  userStatusShares: "/u/:username/statuses/:id/shares",
  updatePost: "/:id",
  deletePost: "/:id",
};

