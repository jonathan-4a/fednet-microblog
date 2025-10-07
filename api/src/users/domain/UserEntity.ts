// src/users/domain/UserEntity.ts

import { ValidationError } from "./UserErrors";
import type { CreateUserInput } from "../ports/in/Users.dto";
export class UserEntity {
  public readonly username: string;
  public displayName: string;
  public summary: string;
  public isActive: boolean;
  public isAdmin: boolean;
  public isFollowingPublic: boolean;
  public createdAt: number;

  constructor(data: CreateUserInput) {
    this.validateUsername(data.username);
    this.username = data.username;
    this.displayName = data.displayName;
    this.summary = data.summary;
    this.isActive = data.isActive;
    this.isAdmin = data.isAdmin;
    this.isFollowingPublic = data.isFollowingPublic;
    this.createdAt = data.createdAt;
  }

  private validateUsername(username: string) {
    if (!username || username.length < 3 || username.length > 30) {
      throw new ValidationError("Username must be between 3 and 30 characters");
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      throw new ValidationError(
        "Username can only contain letters, numbers, and underscores",
      );
    }
    if (username.startsWith("_") || username.endsWith("_")) {
      throw new ValidationError(
        "Username cannot start or end with an underscore",
      );
    }
  }

  private validateProfile(displayName?: string, summary?: string) {
    if (displayName && displayName.length > 100) {
      throw new ValidationError("Display name must be at most 100 characters");
    }
    if (summary && summary.length > 1000) {
      throw new ValidationError("Summary must be at most 1000 characters");
    }
  }

  updateProfile(displayName?: string, summary?: string) {
    this.validateProfile(displayName, summary);
    if (displayName !== undefined) this.displayName = displayName;
    if (summary !== undefined) this.summary = summary;
  }

  canViewFollowing(requesterUsername: string): boolean {
    return this.isFollowingPublic || this.username === requesterUsername;
  }

  toData(): {
    username: string;
    displayName: string;
    summary: string;
    isActive: boolean;
    isAdmin: boolean;
    isFollowingPublic: boolean;
    createdAt: number;
  } {
    return {
      username: this.username,
      displayName: this.displayName,
      summary: this.summary,
      isActive: this.isActive,
      isAdmin: this.isAdmin,
      isFollowingPublic: this.isFollowingPublic,
      createdAt: this.createdAt,
    };
  }
}

