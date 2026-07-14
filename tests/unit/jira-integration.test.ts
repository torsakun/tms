import { beforeEach, describe, expect, it, vi } from "vitest";

const workspaceSettingMock = vi.hoisted(() => ({ findMany: vi.fn() }));
const fetchMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  prisma: { workspaceSetting: workspaceSettingMock },
}));

vi.stubGlobal("fetch", fetchMock);

import { GET } from "@/app/api/integrations/jira/issue/route";

const jiraSettings = [
  { key: "JIRA_DOMAIN", value: "acme.atlassian.net" },
  { key: "JIRA_EMAIL", value: "qa@acme.com" },
  { key: "JIRA_API_TOKEN", value: "jira-token" },
];

const jiraIssueResponse = {
  fields: {
    summary: "Login page is broken",
    description: {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "Steps to reproduce" }] }]
    },
    attachment: []
  }
};

function makeRequest(ticketId?: string) {
  const url = ticketId
    ? `http://localhost/api/integrations/jira/issue?ticketId=${ticketId}`
    : "http://localhost/api/integrations/jira/issue";
  return new Request(url);
}

describe("GET /api/integrations/jira/issue", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when ticketId is missing", async () => {
    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/Ticket ID is required/);
    expect(workspaceSettingMock.findMany).not.toHaveBeenCalled();
  });

  it("returns 400 when Jira credentials are not configured", async () => {
    workspaceSettingMock.findMany.mockResolvedValue([]);

    const res = await GET(makeRequest("TMS-1"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/not configured/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 401 when Jira authentication fails", async () => {
    workspaceSettingMock.findMany.mockResolvedValue(jiraSettings);
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      headers: { get: () => "AUTHENTICATED_FAILED" },
      json: async () => ({ message: "Unauthorized" }),
      text: async () => "Unauthorized",
    });

    const res = await GET(makeRequest("TMS-1"));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toMatch(/Authentication failed/);
  });

  it("returns 404 when ticket does not exist in Jira", async () => {
    workspaceSettingMock.findMany.mockResolvedValue(jiraSettings);
    fetchMock.mockResolvedValue({
      ok: false,
      status: 404,
      headers: { get: () => null },
      json: async () => ({ message: "Not Found" }),
      text: async () => "Not Found",
    });

    const res = await GET(makeRequest("TMS-999"));

    expect(res.status).toBe(404);
  });

  it("returns parsed requirement text from Jira issue", async () => {
    workspaceSettingMock.findMany.mockResolvedValue(jiraSettings);
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => jiraIssueResponse,
    });

    const res = await GET(makeRequest("TMS-1"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.requirementText).toContain("Login page is broken");
    expect(body.requirementText).toContain("Steps to reproduce");
    expect(body.imagesBase64).toEqual([]);
  });
});
