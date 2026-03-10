import type { Context } from "hono";
import type { IGetWebFinger } from "../../ports/in/IGetWebFinger";
import type { IGetActor } from "../../ports/in/IGetActor";
import type { IGetOutbox } from "../../ports/in/IGetOutbox";
import type { IDispatchS2SActivityEvent } from "../../ports/in/IDispatchS2SActivityEvent";
import type { IDispatchC2SActivityEvent } from "../../ports/in/IDispatchC2SActivityEvent";
import type { AuthTokenPayload } from "@auth";
import { SignatureGuard } from "./SignatureGuard";
import {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
} from "../../domain/ActivityPubErrors";

type AppContext = Context<{
  Variables: {
    user?: AuthTokenPayload;
  };
}>;

export class ActivityPubController {
  private readonly signatureGuard = new SignatureGuard();

  constructor(
    private readonly getWebFinger: IGetWebFinger,
    private readonly getActorUseCase: IGetActor,
    private readonly getOutboxUseCase: IGetOutbox,
    private readonly dispatchS2SActivityEvent: IDispatchS2SActivityEvent,
    private readonly dispatchC2SActivityEvent: IDispatchC2SActivityEvent,
    private readonly host: string,
    private readonly protocol: string,
    private readonly domain: string,
  ) {}

  async webfinger(c: Context) {
    const resource = c.req.query("resource");

    if (!resource) {
      throw new ValidationError("Missing resource parameter");
    }

    const response = await this.getWebFinger.execute({
      resource,
      domain: this.domain,
      protocol: this.protocol,
    });

    return c.json(response);
  }

  getInbox(c: AppContext) {
    const username = c.req.param("username");
    const user = c.get("user");

    if (!user) {
      throw new AuthenticationError("Authentication required");
    }

    const expectedUserAddress = `${username}@${this.domain}`;

    if (user.address !== expectedUserAddress) {
      throw new AuthorizationError("You can only view your own inbox");
    }

    return c.json({
      message: "Inbox retrieval not yet implemented",
      username,
    });
  }

  async postInbox(c: Context) {
    const username = c.req.param("username");

    try {
      await this.signatureGuard.verify(c.req.raw);
    } catch {
      throw new AuthenticationError("Invalid or missing HTTP signature");
    }

    const activity = await c.req.json<Record<string, unknown>>();
    await this.dispatchS2SActivityEvent.executeAndAwait({ username, activity });

    return c.json({ status: "accepted" }, 202);
  }

  async getOutbox(c: Context) {
    const username = c.req.param("username");
    const page = c.req.query("page");
    const limit = c.req.query("limit");

    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    if (isNaN(pageNum) || pageNum < 1) {
      throw new ValidationError("Invalid page parameter");
    }
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      throw new ValidationError("Invalid limit parameter");
    }

    const result = await this.getOutboxUseCase.execute({
      username,
      host: this.host,
      protocol: this.protocol,
      page: pageNum,
      limit: limitNum,
    });

    return c.json(result);
  }

  async postOutbox(c: AppContext) {
    const username = c.req.param("username");
    const user = c.get("user");

    if (!user || user.username !== username) {
      throw new AuthorizationError("Forbidden");
    }

    const actorUrl = `${this.protocol}://${this.host}/u/${username}`;
    const activity = await c.req.json<Record<string, unknown>>();
    const incomingActor =
      typeof activity?.actor === "string" ? activity.actor : undefined;

    if (incomingActor && incomingActor !== actorUrl) {
      throw new AuthorizationError("Actor does not match authenticated user");
    }

    const activityType = activity?.type;

    const needsAwait = ["Follow", "Undo", "Like", "Announce"].includes(
      activityType as string,
    );
    const isCreateWithRemoteReply =
      activityType === "Create" &&
      activity?.object &&
      typeof activity.object === "object" &&
      typeof (activity.object as Record<string, unknown>).inReplyTo ===
        "string";

    if (needsAwait || isCreateWithRemoteReply) {
      await this.dispatchC2SActivityEvent.executeAndAwait({
        username,
        activity,
      });
      return c.json({ status: "accepted" }, 200);
    }

    this.dispatchC2SActivityEvent.execute({ username, activity });
    return c.json({ status: "accepted" }, 202);
  }

  async getActor(c: Context) {
    const username = c.req.param("username");

    const result = await this.getActorUseCase.execute({
      username,
      host: this.host,
      protocol: this.protocol,
    });

    return c.json(result);
  }
}
