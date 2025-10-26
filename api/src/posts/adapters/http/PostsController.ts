import type { Context } from "hono";
import type { AuthTokenPayload } from "@auth";
import type { IGetPost } from "../../ports/in/IGetPost";
import type { IGetPostReplies } from "../../ports/in/IGetPostReplies";
import type { IGetPostLikes } from "../../ports/in/IGetPostLikes";
import type { IGetPostShares } from "../../ports/in/IGetPostShares";
import type { IUpdatePost } from "../../ports/in/IUpdatePost";
import type { IDeletePost } from "../../ports/in/IDeletePost";
import type { UpdatePostRequestDto } from "../../ports/in/Posts.dto";
import type {
  NoteOutput,
  OrderedCollectionOutput,
  OrderedCollectionPageOutput,
} from "@apcore";
import { PostValidationError } from "../../domain/PostsErrors";

type AppContext = Context<{
  Variables: {
    user: AuthTokenPayload;
  };
}>;

export class PostsController {
  constructor(
    private readonly getPostUseCase: IGetPost,
    private readonly getPostReplies: IGetPostReplies,
    private readonly getPostLikes: IGetPostLikes,
    private readonly getPostShares: IGetPostShares,
    private readonly updatePostUseCase: IUpdatePost,
    private readonly deletePostUseCase: IDeletePost,
  ) {}

  async getPost(c: Context) {
    const username = c.req.param("username");
    const id = c.req.param("id");
    const guid = this.extractGuid(id);
    const { host, protocol } = this.getHostAndProtocol();

    const result = (await this.getPostUseCase.execute({
      guid,
      username,
      host,
      protocol,
    })) as NoteOutput;

    return c.json(result);
  }

  async getReplies(c: Context) {
    const username = c.req.param("username");
    const id = c.req.param("id");
    const page = c.req.query("page") || undefined;
    const limit = c.req.query("limit") || undefined;

    const guid = this.extractGuid(id);
    const { host, protocol } = this.getHostAndProtocol();
    const pageNum = this.parsePage(page);
    const limitNum = this.parseLimit(limit);

    const result = (await this.getPostReplies.execute({
      guid,
      username,
      host,
      protocol,
      page: pageNum,
      limit: limitNum,
    })) as OrderedCollectionOutput | OrderedCollectionPageOutput;

    return c.json(result);
  }

  async getLikes(c: Context) {
    const username = c.req.param("username");
    const id = c.req.param("id");
    const page = c.req.query("page") || undefined;
    const limit = c.req.query("limit") || undefined;

    const guid = this.extractGuid(id);
    const { host, protocol } = this.getHostAndProtocol();
    const pageNum = this.parsePage(page);
    const limitNum = this.parseLimit(limit);

    const result = (await this.getPostLikes.execute({
      guid,
      username,
      host,
      protocol,
      page: pageNum,
      limit: limitNum,
    })) as OrderedCollectionOutput | OrderedCollectionPageOutput;

    return c.json(result);
  }

  async getShares(c: Context) {
    const username = c.req.param("username");
    const id = c.req.param("id");
    const page = c.req.query("page") || undefined;
    const limit = c.req.query("limit") || undefined;

    const guid = this.extractGuid(id);
    const { host, protocol } = this.getHostAndProtocol();
    const pageNum = this.parsePage(page);
    const limitNum = this.parseLimit(limit);

    const result = (await this.getPostShares.execute({
      guid,
      username,
      host,
      protocol,
      page: pageNum,
      limit: limitNum,
    })) as OrderedCollectionOutput | OrderedCollectionPageOutput;

    return c.json(result);
  }

  private extractGuid(id: string): string {
    return id.includes("#note-") ? id.split("#note-")[1] : id;
  }

  private parsePage(page?: string): number {
    if (!page) return 1;
    const parsed = parseInt(page, 10);
    return isNaN(parsed) || parsed < 1 ? 1 : parsed;
  }

  private parseLimit(limit?: string): number {
    if (!limit) return 20;
    const parsed = parseInt(limit, 10);
    if (isNaN(parsed) || parsed < 1) return 20;
    return Math.min(parsed, 100); // Max limit of 100
  }

  async updatePost(c: AppContext) {
    const id = c.req.param("id");
    const body = await c.req.json<UpdatePostRequestDto>();
    const guid = this.extractGuid(id);
    const user = c.get("user");

    const result = await this.updatePostUseCase.execute({
      guid,
      username: user.username,
      content: body.content,
    });

    return c.json(result);
  }

  async deletePost(c: AppContext) {
    const id = c.req.param("id");
    const guid = this.extractGuid(id);
    const user = c.get("user");

    await this.deletePostUseCase.execute({
      guid,
      username: user.username,
    });

    return c.json({ success: true });
  }

  private getHostAndProtocol() {
    const domain = process.env.DOMAIN;
    const protocol = process.env.PROTOCOL;
    const port = process.env.PORT;

    if (!domain || !protocol || !port) {
      throw new PostValidationError(
        "DOMAIN, PROTOCOL, and PORT must be configured",
      );
    }

    const host = port === "80" || port === "443" ? domain : `${domain}:${port}`;
    return { host, protocol };
  }
}

