import { beforeEach, describe, expect, it, vi } from "vitest";

const testCaseMock = vi.hoisted(() => ({ findUnique: vi.fn(), update: vi.fn() }));
const fetchMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({ prisma: { testCase: testCaseMock } }));
vi.stubGlobal("fetch", fetchMock);

import { POST } from "@/app/api/projects/[code]/cases/[caseId]/github/pr/route";

const routeParams = (code: string, caseId: string) => ({
  params: Promise.resolve({ code, caseId }),
});

const fakeTestCase = {
  id: "case-001",
  title: "Login flow",
  automationScript: "await page.goto('/login')",
  suite: { title: "Auth Suite" },
  project: {
    githubToken: "gh-token",
    githubOwner: "acme",
    githubRepo: "tests",
  },
};

function mockGitHubSuccess() {
  fetchMock
    .mockResolvedValueOnce({ ok: true, json: async () => ({ object: { sha: "main-sha" } }) })   // get ref
    .mockResolvedValueOnce({ ok: true, json: async () => ({}) })                                  // create branch
    .mockResolvedValueOnce({ ok: true, json: async () => ({}) })                                  // create file
    .mockResolvedValueOnce({ ok: true, json: async () => ({ html_url: "https://github.com/acme/tests/pull/1" }) }); // create PR
}

describe("POST /api/projects/[code]/cases/[caseId]/github/pr", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testCaseMock.update.mockResolvedValue(fakeTestCase);
  });

  it("returns 404 when test case not found", async () => {
    testCaseMock.findUnique.mockResolvedValue(null);

    const res = await POST(
      new Request("http://localhost/api/projects/FIN/cases/case-001/github/pr", { method: "POST" }),
      routeParams("FIN", "case-001")
    );

    expect(res.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 404 when test case has no automation script", async () => {
    testCaseMock.findUnique.mockResolvedValue({ ...fakeTestCase, automationScript: null });

    const res = await POST(
      new Request("http://localhost/api/projects/FIN/cases/case-001/github/pr", { method: "POST" }),
      routeParams("FIN", "case-001")
    );

    expect(res.status).toBe(404);
  });

  it("returns 400 when GitHub credentials are not configured", async () => {
    testCaseMock.findUnique.mockResolvedValue({
      ...fakeTestCase,
      project: { githubToken: null, githubOwner: null, githubRepo: null },
    });

    const res = await POST(
      new Request("http://localhost/api/projects/FIN/cases/case-001/github/pr", { method: "POST" }),
      routeParams("FIN", "case-001")
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/GitHub integration is not configured/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("creates PR and updates githubPrUrl on success", async () => {
    testCaseMock.findUnique.mockResolvedValue(fakeTestCase);
    mockGitHubSuccess();

    const res = await POST(
      new Request("http://localhost/api/projects/FIN/cases/case-001/github/pr", { method: "POST" }),
      routeParams("FIN", "case-001")
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.prUrl).toContain("github.com");
    expect(testCaseMock.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ githubPrUrl: expect.stringContaining("github.com") }) })
    );
  });

  it("returns 500 when GitHub API fails", async () => {
    testCaseMock.findUnique.mockResolvedValue(fakeTestCase);
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({ message: "Not Found" }) });

    const res = await POST(
      new Request("http://localhost/api/projects/FIN/cases/case-001/github/pr", { method: "POST" }),
      routeParams("FIN", "case-001")
    );

    expect(res.status).toBe(500);
  });
});
