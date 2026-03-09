import type { IUserRepository } from "../ports/out/IUserRepository";
import type { UpdateUserProfileInput } from "../ports/in/Users.dto";
import type { IUpdateUserProfile } from "../ports/in/IUpdateUserProfile";
import { UserProfileOutput } from "../ports/in/Users.dto";
import { NotFoundError, ValidationError } from "../domain/UserErrors";
import { UserEntity } from "../domain/UserEntity";

export class UpdateUserProfile implements IUpdateUserProfile {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: UpdateUserProfileInput): Promise<UserProfileOutput> {
    if (
      input.displayName === undefined &&
      input.summary === undefined &&
      input.isFollowingPublic === undefined
    ) {
      throw new ValidationError("No profile changes provided");
    }

    const userData = await this.userRepository.findUserByUsername(
      input.username,
    );
    if (!userData) {
      throw new NotFoundError();
    }

    const user = new UserEntity(userData);
    user.updateProfile(input.displayName, input.summary);
    if (input.isFollowingPublic !== undefined) {
      user.isFollowingPublic = input.isFollowingPublic;
    }

    await this.userRepository.updateUserProfile(user.toData());

    return {
      username: user.username,
      displayName: user.displayName,
      summary: user.summary,
      isFollowingPublic: user.isFollowingPublic,
      createdAt: user.createdAt,
    };
  }
}
