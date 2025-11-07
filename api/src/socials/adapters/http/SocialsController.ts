import type { Context } from "hono";
import type { IGetFollowers } from "../../ports/in/IGetFollowers";
import type { IGetFollowing } from "../../ports/in/IGetFollowing";
import type { IGetLiked } from "@posts";
import { SocialsInternalServerError } from "../../domain/SocialsErrors";

export class SocialsController {
  constructor(
    private readonly getFollowers: IGetFollowers,
    private readonly getFollowing: IGetFollowing,
    private readonly getLiked: IGetLiked,
  ) {}

  async followers(c: Context): Promise<Response> {
    const username = c.req.param("username");
    const pageParam = c.req.query("page");
    const page = pageParam !== undefined && pageParam !== "" ? Number(pageParam) : undefined;
    const { host, protocol } = this.getHostAndProtocol();

    const result = await this.getFollowers.execute({
      username,
      host,
      protocol,
      page,
    });
    return c.json(result);
  }

  async following(c: Context): Promise<Response> {
    const username = c.req.param("username");
    const pageParam = c.req.query("page");
    const page = pageParam !== undefined && pageParam !== "" ? Number(pageParam) : undefined;
    const { host, protocol } = this.getHostAndProtocol();

    const result = await this.getFollowing.execute({
      username,
      host,
      protocol,
      page,
    });
    return c.json(result);
  }

  async liked(c: Context): Promise<Response> {
    const username = c.req.param("username");
    const { host, protocol } = this.getHostAndProtocol();

    const result = await this.getLiked.execute({ username, host, protocol });
    return c.json(result);
  }

  // TODO: move to shared module
  private getHostAndProtocol() {
    const domain = process.env.DOMAIN;
    const protocol = process.env.PROTOCOL;
    const port = process.env.PORT;

    if (!domain || !protocol || !port) {
      throw new SocialsInternalServerError(
        "DOMAIN, PROTOCOL, and PORT must be configured",
      );
    }

    const host = port === "80" || port === "443" ? domain : `${domain}:${port}`;
    return { host, protocol };
  }
}

