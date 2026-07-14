import { beforeEach, describe, expect, it, vi } from "vitest";

const userMock = vi.hoisted(() => ({
  findUnique: vi.fn(),
  count: vi.fn(),
  create: vi.fn()
}));

const bcryptMock = vi.hoisted(() => ({
  hash: vi.fn()
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: userMock
  }
}));

vi.mock("bcrypt", () => ({
  default: bcryptMock
}));

import { POST } from "@/app/api/auth/register/route";

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" }
  });
}

describe("register API route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects registration when email is missing", async () => {
    const response = await POST(jsonRequest({
      name: "QA Lead",
      password: "secret-password"
    }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Missing required fields" });
    expect(userMock.findUnique).not.toHaveBeenCalled();
    expect(userMock.create).not.toHaveBeenCalled();
  });

  it("rejects registration when password is missing", async () => {
    const response = await POST(jsonRequest({
      name: "QA Lead",
      email: "qa@example.com"
    }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Missing required fields" });
    expect(userMock.findUnique).not.toHaveBeenCalled();
    expect(userMock.create).not.toHaveBeenCalled();
  });

  it("rejects duplicate email registration", async () => {
    userMock.count.mockResolvedValue(0);
    userMock.findUnique.mockResolvedValue({
      id: "user-1",
      email: "qa@example.com"
    });

    const response = await POST(jsonRequest({
      name: "QA Lead",
      email: "qa@example.com",
      password: "secret-password"
    }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(userMock.findUnique).toHaveBeenCalledWith({
      where: { email: "qa@example.com" }
    });
    expect(body).toEqual({ error: "User already exists" });
    expect(bcryptMock.hash).not.toHaveBeenCalled();
    expect(userMock.create).not.toHaveBeenCalled();
  });

  it("creates the first registered user as an admin with a hashed password", async () => {
    userMock.findUnique.mockResolvedValue(null);
    userMock.count.mockResolvedValue(0);
    bcryptMock.hash.mockResolvedValue("hashed-secret");
    userMock.create.mockResolvedValue({
      id: "user-1",
      email: "qa@example.com",
      role: "ADMIN",
      passwordHash: "hashed-secret"
    });

    const response = await POST(jsonRequest({
      name: "QA Lead",
      email: "qa@example.com",
      password: "secret-password"
    }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(bcryptMock.hash).toHaveBeenCalledWith("secret-password", 10);
    expect(userMock.create).toHaveBeenCalledWith({
      data: {
        name: "QA Lead",
        email: "qa@example.com",
        passwordHash: "hashed-secret",
        role: "ADMIN"
      }
    });
    expect(body).toEqual({
      success: true,
      user: {
        id: "user-1",
        email: "qa@example.com",
        role: "ADMIN"
      }
    });
    expect(JSON.stringify(body)).not.toContain("passwordHash");
  });

  it("rejects self-registration once a user already exists (invite-only)", async () => {
    userMock.count.mockResolvedValue(3);

    const response = await POST(jsonRequest({
      name: "Tester",
      email: "tester@example.com",
      password: "secret-password"
    }));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toContain("invite-only");
    expect(userMock.findUnique).not.toHaveBeenCalled();
    expect(bcryptMock.hash).not.toHaveBeenCalled();
    expect(userMock.create).not.toHaveBeenCalled();
  });

  it("returns a generic error when registration fails unexpectedly", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    userMock.count.mockResolvedValue(0);
    userMock.findUnique.mockRejectedValue(new Error("database unavailable"));

    const response = await POST(jsonRequest({
      name: "QA Lead",
      email: "qa@example.com",
      password: "secret-password"
    }));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "Failed to register user" });
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));

    consoleErrorSpy.mockRestore();
  });
});
