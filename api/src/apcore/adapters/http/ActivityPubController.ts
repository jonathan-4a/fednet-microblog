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
  InternalServerError,
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
  ) {}

  async webfinger(c: Context) {
    const resource = c.req.query("resource");

    if (!resource) {
      throw new ValidationError("Missing resource parameter");
    }

    const domain = process.env.DOMAIN;
    const protocol = process.env.PROTOCOL;

    if (!domain || !protocol) {
      throw new InternalServerError("DOMAIN and PROTOCOL must be configured");
    }

    const response = await this.getWebFinger.execute({
      resource,
      domain,
      protocol,
    });

    return c.json(response);
  }

  async getInbox(c: AppContext) {
    const username = c.req.param("username");
    const user = c.get("user");

    if (!user) {
      throw new AuthenticationError("Authentication required");
    }

    const domain = process.env.DOMAIN;
    if (!domain) {
      throw new InternalServerError("DOMAIN must be configured");
    }

    const expectedUserAddress = `${username}@${domain}`;

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
    } catch (error) {
      throw new AuthenticationError("Invalid or missing HTTP signature");
    }

    const activity = await c.req.json<Record<string, unknown>>();
    this.dispatchS2SActivityEvent.execute({ username, activity });

    return c.json({ status: "accepted" }, 202);
  }

  async getOutbox(c: Context) {
    const username = c.req.param("username");
    const page = c.req.query("page");
    const limit = c.req.query("limit");

    const domain = process.env.DOMAIN;
    const protocol = process.env.PROTOCOL;
    const port = process.env.PORT;

    if (!domain || !protocol || !port) {
      throw new InternalServerError(
        "DOMAIN, PROTOCOL, and PORT must be configured",
      );
    }

    const host = port === "80" || port === "443" ? domain : `${domain}:${port}`;
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
      host,
      protocol,
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

    const domain = process.env.DOMAIN;
    const protocol = process.env.PROTOCOL;
    const port = process.env.PORT;

    if (!domain || !protocol || !port) {
      throw new InternalServerError(
        "DOMAIN, PROTOCOL, and PORT must be configured",
      );
    }

    const host = port === "80" || port === "443" ? domain : `${domain}:${port}`;
    const actorUrl = `${protocol}://${host}/u/${username}`;
    const activity = await c.req.json<Record<string, unknown>>();
    const incomingActor =
      typeof activity?.actor === "string" ? activity.actor : undefined;

    if (incomingActor && incomingActor !== actorUrl) {
      throw new AuthorizationError("Actor does not match authenticated user");
    }

    const activityType = activity?.type;

    // For Follow activities, pass response callback
    if (activityType === "Follow") {
      const responseCallback = (error?: Error) => {
        // Note: In Bun, we can't use Express response object
        // This will need to be handled differently - maybe via events or return value
        if (error) {
          console.error("Follow activity error:", error);
        }
      };

      this.dispatchC2SActivityEvent.execute({
        username,
        activity,
        responseCallback,
      });

      return c.json({ status: "accepted" }, 200);
    }

    // For other activities, return immediately
    this.dispatchC2SActivityEvent.execute({ username, activity });
    return c.json({ status: "accepted" }, 202);
  }

  async getActor(c: Context) {
    const username = c.req.param("username");

    const domain = process.env.DOMAIN;
    const protocol = process.env.PROTOCOL;
    const port = process.env.PORT;

    if (!domain || !protocol || !port) {
      throw new InternalServerError(
        "DOMAIN, PROTOCOL, and PORT must be configured",
      );
    }

    const host = port === "80" || port === "443" ? domain : `${domain}:${port}`;

    const result = await this.getActorUseCase.execute({
      username,
      host,
      protocol,
    });

    return c.json(result);
  }
}

