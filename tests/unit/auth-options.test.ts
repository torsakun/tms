import { beforeEach, describe, expect, it, vi } from "vitest";

const userMock = vi.hoisted(() => ({
  findUnique: vi.fn()
}));

const bcryptMock = vi.hoisted(() => ({
  compare: vi.fn()
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: userMock
  }
}));

vi.mock("bcrypt", () => ({
  default: bcryptMock
}));

import { authOptions } from "@/lib/auth";

const credentialsProvider = authOptions.providers[0] as any;
const authorize = credentialsProvider.options.authorize;

describe("authOptions credentials provider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("authorizes a user with valid email and password", async () => {
    userMock.findUnique.mockResolvedValue({
      id: "user-1",
      email: "qa@example.com",
      name: "QA Lead",
      passwordHash: "hashed-password",
      role: "ADMIN"
    });
    bcryptMock.compare.mockResolvedValue(true);

    const user = await authorize({
      email: "qa@example.com",
      password: "correct-password"
    });

    expect(userMock.findUnique).toHaveBeenCalledWith({
      where: { email: "qa@example.com" }
    });
    expect(bcryptMock.compare).toHaveBeenCalledWith("correct-password", "hashed-password");
    expect(user).toEqual({
      id: "user-1",
      email: "qa@example.com",
      name: "QA Lead",
      role: "ADMIN"
    });
  });

  it("rejects missing credentials", async () => {
    await expect(authorize({ email: "qa@example.com" }))
      .rejects.toThrow("Invalid credentials");

    expect(userMock.findUnique).not.toHaveBeenCalled();
    expect(bcryptMock.compare).not.toHaveBeenCalled();
  });

  it("rejects an unknown email", async () => {
    userMock.findUnique.mockResolvedValue(null);

    await expect(authorize({
      email: "missing@example.com",
      password: "password"
    })).rejects.toThrow("User not found");

    expect(bcryptMock.compare).not.toHaveBeenCalled();
  });

  it("rejects an invalid password", async () => {
    userMock.findUnique.mockResolvedValue({
      id: "user-1",
      email: "qa@example.com",
      name: "QA Lead",
      passwordHash: "hashed-password",
      role: "USER"
    });
    bcryptMock.compare.mockResolvedValue(false);

    await expect(authorize({
      email: "qa@example.com",
      password: "wrong-password"
    })).rejects.toThrow("Invalid password");
  });
});

describe("authOptions callbacks", () => {
  it("adds user id and role to the JWT", async () => {
    const token = await authOptions.callbacks!.jwt!({
      token: { email: "qa@example.com" },
      user: { id: "user-1", role: "ADMIN" } as any,
      account: null,
      profile: undefined,
      trigger: "signIn"
    });

    expect(token).toMatchObject({
      email: "qa@example.com",
      id: "user-1",
      role: "ADMIN"
    });
  });

  it("adds token id and role to the session user", async () => {
    const session = await authOptions.callbacks!.session!({
      session: {
        user: { name: "QA Lead", email: "qa@example.com" },
        expires: "2026-06-17T00:00:00.000Z"
      },
      token: { id: "user-1", role: "ADMIN" },
      user: undefined as any,
      newSession: undefined,
      trigger: "update"
    });

    expect(session.user).toMatchObject({
      name: "QA Lead",
      email: "qa@example.com",
      id: "user-1",
      role: "ADMIN"
    });
  });
});
