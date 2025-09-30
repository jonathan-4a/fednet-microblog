import type { Context } from "hono";
import type {
  RegisterUserInput,
  LoginUserInput,
} from "../../ports/in/Auth.dto";
import type { ILoginUser } from "../../ports/in/ILoginUser";
import type { ILogoutUser } from "../../ports/in/ILogoutUser";
import type { IRegisterUser } from "../../ports/in/IRegisterUser";
import {
  AuthValidationError,
  AuthenticationError,
} from "../../domain/AuthErrors";

export class AuthController {
  constructor(
    private readonly loginUser: ILoginUser,
    private readonly logoutUser: ILogoutUser,
    private readonly registerUser: IRegisterUser,
  ) {}

  async register(c: Context) {
    const body = await c.req.json<RegisterUserInput>();
    const {
      username: preferredUsername,
      password,
      displayName: display_name,
      summary,
      inviteToken: invite_token,
    } = body;

    if (!preferredUsername || !password) {
      throw new AuthValidationError(
        "Missing required fields: username, password",
      );
    }

    await this.registerUser.execute({
      username: preferredUsername,
      password,
      displayName: display_name,
      summary: summary,
      inviteToken: invite_token,
    });

    return c.json({ success: true }, 201);
  }

  async login(c: Context) {
    const body = await c.req.json<LoginUserInput>();
    const { username, password } = body;
    const domain = process.env.DOMAIN!;
    const protocol = process.env.PROTOCOL!;

    if (!username || !password) {
      throw new AuthValidationError("Missing username or password");
    }

    const result = await this.loginUser.execute({
      username,
      password,
      domain,
      protocol,
    });

    return c.json(result);
  }

  async logout(c: Context) {
    const authHeader = c.req.header("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AuthenticationError("Missing or invalid authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    await this.logoutUser.execute({ token });

    return c.json({ msg: "Logged out successfully" });
  }
}

