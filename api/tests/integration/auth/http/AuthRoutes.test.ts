import { describe, it, expect, mock, beforeEach } from "bun:test";
import { Hono } from "hono";
import { createAuthRoutes } from "@auth";

describe("AuthRoutes HTTP Integration", () => {
  let loginUser: any;
  let logoutUser: any;
  let registerUser: any;
  let app: Hono;

  beforeEach(() => {
    loginUser = {
      execute: mock(() => Promise.resolve({
        token: "fake-jwt-token",
        user: { username: "testuser", isActive: true }
      }))
    };
    
    logoutUser = {
      execute: mock(() => Promise.resolve())
    };
    
    registerUser = {
      execute: mock(() => Promise.resolve({ success: true }))
    };

    app = createAuthRoutes(loginUser, logoutUser, registerUser);
  });

  describe("POST /register", () => {
    it("should successfully register and return 201", async () => {
      const res = await app.request("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "testuser",
          password: "password123",
          displayName: "Test",
          summary: "Summary"
        })
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data).toEqual({ success: true });
      expect(registerUser.execute).toHaveBeenCalledWith({
        username: "testuser",
        password: "password123",
        displayName: "Test",
        summary: "Summary",
        inviteToken: undefined // Explicitly checking mapped body fields
      });
    });
  });

  describe("POST /login", () => {
    it("should process login and return the token and user data", async () => {
      const res = await app.request("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "testuser",
          password: "password123"
        })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.token).toBe("fake-jwt-token");
      expect(data.user.username).toBe("testuser");
      
      expect(loginUser.execute).toHaveBeenCalledWith({
        username: "testuser",
        password: "password123",
      });
    });
  });

  describe("POST /logout", () => {
    it("should successfully logout when providing a valid token", async () => {
      const res = await app.request("/logout", {
        method: "POST",
        headers: { 
          "Authorization": "Bearer fake-jwt-token" 
        }
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.msg).toBe("Logged out successfully");
      
      expect(logoutUser.execute).toHaveBeenCalledWith({ token: "fake-jwt-token" });
    });
  });
});

