import type { IUserRepository } from "../ports/out/IUserRepository";
import type {
  IGetUserProfile,
  GetUserProfileInput,
} from "../ports/in/IGetUserProfile";
import { AuthenticatedUserOutput } from "../ports/in/Users.dto";
import { NotFoundError } from "../domain/UserErrors";

export class GetUserProfile implements IGetUserProfile {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: GetUserProfileInput): Promise<AuthenticatedUserOutput> {
    const user = await this.userRepository.findUserByUsername(input.username);
    if (!user) {
      throw new NotFoundError();
    }

    return {
      username: user.username,
      displayName: user.displayName,
      summary: user.summary,
      isFollowingPublic: user.isFollowingPublic,
      createdAt: user.createdAt,
      isActive: user.isActive,
      isAdmin: user.isAdmin,
    };
  }
}
