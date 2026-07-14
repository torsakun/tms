import { beforeEach, describe, expect, it, vi } from "vitest";

const workspaceSettingMock = vi.hoisted(() => ({
  findMany: vi.fn(),
  upsert: vi.fn(),
}));
const prismaMock = vi.hoisted(() => ({
  workspaceSetting: workspaceSettingMock,
  $transaction: vi.fn(),
}));

const apiAuthMock = vi.hoisted(() => ({
  getSessionUser: vi.fn(),
  unauthorized: vi.fn(
    () => new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
  ),
  forbidden: vi.fn(
    () => new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 }),
  ),
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/api-auth", () => apiAuthMock);
vi.mock("@/lib/permissions", () => ({
  canManageWorkspace: vi.fn(() => true),
  canManageRoles: vi.fn(() => true),
  canManageUsers: vi.fn(() => true),
  canManageProjects: vi.fn(() => true),
}));

import { GET, POST } from "@/app/api/workspace/settings/route";

const ADMIN_USER = { id: "u1", role: "ADMIN", workspaceRole: { permissions: ["all"] } };

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/workspace/settings", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("GET /api/workspace/settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiAuthMock.getSessionUser.mockResolvedValue(ADMIN_USER);
  });

  it("returns settings as key-value object", async () => {
    workspaceSettingMock.findMany.mockResolvedValue([
      { key: "SMTP_HOST", value: "smtp.example.com" },
      { key: "APP_NAME", value: "TMS" },
    ]);

    const res = await GET(new Request("http://localhost/api/workspace/settings"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.SMTP_HOST).toBe("smtp.example.com");
    expect(body.APP_NAME).toBe("TMS");
  });

  it("masks OPENAI_API_KEY keeping only last 4 chars", async () => {
    workspaceSettingMock.findMany.mockResolvedValue([
      { key: "OPENAI_API_KEY", value: "sk-secret1234" },
    ]);

    const res = await GET(new Request("http://localhost/api/workspace/settings"));
    const body = await res.json();

    expect(body.OPENAI_API_KEY).not.toBe("sk-secret1234");
    expect(body.OPENAI_API_KEY).toContain("1234");
    expect(body.OPENAI_API_KEY).toContain("••••");
  });

  it("masks GEMINI_API_KEY, CLAUDE_API_KEY, and JIRA_API_TOKEN", async () => {
    workspaceSettingMock.findMany.mockResolvedValue([
      { key: "GEMINI_API_KEY", value: "gem-abcd5678" },
      { key: "CLAUDE_API_KEY", value: "cl-efgh9012" },
      { key: "JIRA_API_TOKEN", value: "jira-xyz3456" },
    ]);

    const res = await GET(new Request("http://localhost/api/workspace/settings"));
    const body = await res.json();

    expect(body.GEMINI_API_KEY).toContain("5678");
    expect(body.CLAUDE_API_KEY).toContain("9012");
    expect(body.JIRA_API_TOKEN).toContain("3456");
    expect(body.GEMINI_API_KEY).toContain("••••");
  });

  it("returns 500 when DB throws", async () => {
    workspaceSettingMock.findMany.mockRejectedValue(new Error("DB error"));

    const res = await GET(new Request("http://localhost/api/workspace/settings"));

    expect(res.status).toBe(500);
  });
});

describe("POST /api/workspace/settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiAuthMock.getSessionUser.mockResolvedValue(ADMIN_USER);
  });

  it("upserts each non-masked non-empty key-value pair", async () => {
    prismaMock.$transaction.mockResolvedValue([]);
    workspaceSettingMock.upsert.mockResolvedValue({});

    const res = await POST(
      jsonRequest({ OPENAI_API_KEY: "sk-new-key", APP_NAME: "TMS" })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(workspaceSettingMock.upsert).toHaveBeenCalledTimes(2);
    expect(prismaMock.$transaction).toHaveBeenCalledOnce();
  });

  it("skips keys that start with masked bullet characters", async () => {
    prismaMock.$transaction.mockResolvedValue([]);
    workspaceSettingMock.upsert.mockResolvedValue({});

    await POST(
      jsonRequest({ OPENAI_API_KEY: "••••••••••••••••••••••••••••5678", APP_NAME: "TMS" })
    );

    // Only APP_NAME should be upserted — masked key is skipped
    expect(workspaceSettingMock.upsert).toHaveBeenCalledTimes(1);
  });

  it("skips empty string values", async () => {
    prismaMock.$transaction.mockResolvedValue([]);

    await POST(jsonRequest({ OPENAI_API_KEY: "", APP_NAME: "  " }));

    expect(workspaceSettingMock.upsert).not.toHaveBeenCalled();
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("returns 200 with no DB writes when all values are empty", async () => {
    const res = await POST(jsonRequest({ OPENAI_API_KEY: "" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("returns 500 when DB throws", async () => {
    prismaMock.$transaction.mockRejectedValue(new Error("DB error"));
    workspaceSettingMock.upsert.mockResolvedValue({});

    const res = await POST(jsonRequest({ APP_NAME: "TMS" }));

    expect(res.status).toBe(500);
  });
});
