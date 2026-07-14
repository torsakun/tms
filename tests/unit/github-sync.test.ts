import { beforeEach, describe, expect, it, vi } from "vitest";

const projectMock = vi.hoisted(() => ({ findUnique: vi.fn() }));
const testCaseMock = vi.hoisted(() => ({ findMany: vi.fn(), updateMany: vi.fn() }));
const fetchMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  prisma: { project: projectMock, testCase: testCaseMock },
}));

vi.stubGlobal("fetch", fetchMock);

import { POST } from "@/app/api/projects/[code]/github/sync-all/route";

const routeParams = (code: string) => ({ params: Promise.resolve({ code }) });

const fakeProject = {
  id: "proj-fin", code: "FIN",
  githubToken: "gh-token", githubOwner: "acme", githubRepo: "tests",
};

const fakeCase = {
  id: "case-001", title: "Login test", automationScript: "await page.goto('/')",
  suite: { title: "Auth" },
};

function mockGitHubSuccess() {
  fetchMock
    .mockResolvedValueOnce({ ok: true, json: async () => ({ object: { sha: "main-sha" } }) })      // get ref
    .mockResolvedValueOnce({ ok: true, json: async () => ({ tree: { sha: "tree-sha" } }) })         // get commit
    .mockResolvedValueOnce({ ok: true, json: async () => ({ sha: "new-tree-sha" }) })               // create tree
    .mockResolvedValueOnce({ ok: true, json: async () => ({ sha: "new-commit-sha" }) })             // create commit
    .mockResolvedValueOnce({ ok: false })                                                            // check branch (not exist)
    .mockResolvedValueOnce({ ok: true, json: async () => ({}) })                                    // create branch
    .mockResolvedValueOnce({ ok: true, json: async () => ({ html_url: "https://github.com/acme/tests/pull/1", number: 1 }) }); // create PR
}

describe("POST /api/projects/[code]/github/sync-all", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testCaseMock.updateMany.mockResolvedValue({ count: 1 });
  });

  it("returns 404 when project not found", async () => {
    projectMock.findUnique.mockResolvedValue(null);

    const res = await POST(new Request("http://localhost/api/projects/NOTEXIST/github/sync-all", { method: "POST" }), routeParams("NOTEXIST"));

    expect(res.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 400 when no automated test cases found", async () => {
    projectMock.findUnique.mockResolvedValue(fakeProject);
    testCaseMock.findMany.mockResolvedValue([]);

    const res = await POST(new Request("http://localhost/api/projects/FIN/github/sync-all", { method: "POST" }), routeParams("FIN"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/No automated test cases/);
  });

  it("returns 400 when GitHub credentials are not configured", async () => {
    projectMock.findUnique.mockResolvedValue({ ...fakeProject, githubToken: null, githubOwner: null, githubRepo: null });
    testCaseMock.findMany.mockResolvedValue([fakeCase]);

    const res = await POST(new Request("http://localhost/api/projects/FIN/github/sync-all", { method: "POST" }), routeParams("FIN"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/GitHub integration is not configured/);
  });

  it("syncs cases and creates PR successfully", async () => {
    projectMock.findUnique.mockResolvedValue(fakeProject);
    testCaseMock.findMany.mockResolvedValue([fakeCase]);
    mockGitHubSuccess();

    const res = await POST(new Request("http://localhost/api/projects/FIN/github/sync-all", { method: "POST" }), routeParams("FIN"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.count).toBe(1);
    expect(body.prUrl).toContain("github.com");
  });

  it("updates githubPrUrl on all synced test cases after success", async () => {
    projectMock.findUnique.mockResolvedValue(fakeProject);
    testCaseMock.findMany.mockResolvedValue([fakeCase]);
    mockGitHubSuccess();

    await POST(new Request("http://localhost/api/projects/FIN/github/sync-all", { method: "POST" }), routeParams("FIN"));

    expect(testCaseMock.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ githubPrUrl: expect.stringContaining("github.com") }) })
    );
  });
});
