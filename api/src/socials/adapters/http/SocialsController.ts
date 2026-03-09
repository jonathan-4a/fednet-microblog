import type { Context } from "hono";
import type { IGetFollowers } from "../../ports/in/IGetFollowers";
import type { IGetFollowing } from "../../ports/in/IGetFollowing";
import type { IGetLiked } from "@posts";

export class SocialsController {
  constructor(
    private readonly getFollowers: IGetFollowers,
    private readonly getFollowing: IGetFollowing,
    private readonly getLiked: IGetLiked,
    private readonly host: string,
    private readonly protocol: string,
  ) {}

  async followers(c: Context): Promise<Response> {
    const username = c.req.param("username");
    const pageParam = c.req.query("page");
    const page =
      pageParam !== undefined && pageParam !== ""
        ? Number(pageParam)
        : undefined;

    const result = await this.getFollowers.execute({
      username,
      host: this.host,
      protocol: this.protocol,
      page,
    });
    return c.json(result);
  }

  async following(c: Context): Promise<Response> {
    const username = c.req.param("username");
    const pageParam = c.req.query("page");
    const page =
      pageParam !== undefined && pageParam !== ""
        ? Number(pageParam)
        : undefined;

    const result = await this.getFollowing.execute({
      username,
      host: this.host,
      protocol: this.protocol,
      page,
    });
    return c.json(result);
  }

  async liked(c: Context): Promise<Response> {
    const username = c.req.param("username");

    const result = await this.getLiked.execute({
      username,
      host: this.host,
      protocol: this.protocol,
    });
    return c.json(result);
  }
}
