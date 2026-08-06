import { beforeEach, describe, expect, it, vi } from "vitest";

const workspaceSettingMock = vi.hoisted(() => ({ findMany: vi.fn() }));
const testCaseMock = vi.hoisted(() => ({ findUnique: vi.fn(), update: vi.fn() }));
const generateTextMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  prisma: { workspaceSetting: workspaceSettingMock, testCase: testCaseMock },
}));

vi.mock("ai", () => ({ generateText: generateTextMock }));
vi.mock("@ai-sdk/openai", () => ({ createOpenAI: () => () => "openai-model" }));
vi.mock("@ai-sdk/google", () => ({ createGoogleGenerativeAI: () => () => "google-model" }));
vi.mock("@ai-sdk/anthropic", () => ({ createAnthropic: () => () => "anthropic-model" }));

import { POST } from "@/app/api/projects/[code]/ai/batch-generate/route";

const routeParams = (code: string) => ({ params: Promise.resolve({ code }) });

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/projects/FIN/ai/batch-generate", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

const fakeCase = {
  id: "case-001",
  title: "Login flow",
  description: "Test login page",
  steps: [{ action: "Go to /login", expectedResult: "Login page shown", position: 1 }],
};

describe("POST /api/projects/[code]/ai/batch-generate", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when caseIds is missing or empty", async () => {
    const res = await POST(jsonRequest({ caseIds: [] }), routeParams("FIN"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/No caseIds provided/);
    expect(generateTextMock).not.toHaveBeenCalled();
  });

  it("throws when OpenAI key is not configured", async () => {
    workspaceSettingMock.findMany.mockResolvedValue([]);
    testCaseMock.findUnique.mockResolvedValue(fakeCase);

    const res = await POST(jsonRequest({ caseIds: ["case-001"], modelProvider: "openai" }), routeParams("FIN"));

    expect(res.status).toBe(500);
  });

  it("throws when Gemini key is not configured", async () => {
    workspaceSettingMock.findMany.mockResolvedValue([]);
    testCaseMock.findUnique.mockResolvedValue(fakeCase);

    const res = await POST(jsonRequest({ caseIds: ["case-001"], modelProvider: "gemini" }), routeParams("FIN"));

    expect(res.status).toBe(500);
  });

  it("throws when Claude key is not configured", async () => {
    workspaceSettingMock.findMany.mockResolvedValue([]);
    testCaseMock.findUnique.mockResolvedValue(fakeCase);

    const res = await POST(jsonRequest({ caseIds: ["case-001"], modelProvider: "claude" }), routeParams("FIN"));

    expect(res.status).toBe(500);
  });

  it("generates script and updates test case when OpenAI key is set", async () => {
    workspaceSettingMock.findMany.mockResolvedValue([{ key: "OPENAI_API_KEY", value: "sk-test" }]);
    testCaseMock.findUnique.mockResolvedValue(fakeCase);
    generateTextMock.mockResolvedValue({ text: "await page.goto('/login');" });
    testCaseMock.update.mockResolvedValue({ ...fakeCase, automationScript: "await page.goto('/login');" });

    const res = await POST(
      jsonRequest({ caseIds: ["case-001"], modelProvider: "openai" }),
      routeParams("FIN")
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.results).toHaveLength(1);
    expect(body.results[0].status).toBe("success");
    expect(testCaseMock.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ automationScript: expect.any(String) }) })
    );
  });
});
