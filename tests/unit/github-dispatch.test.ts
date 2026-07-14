import { beforeEach, describe, expect, it, vi } from "vitest";

const testRunMock = vi.hoisted(() => ({ findUnique: vi.fn(), update: vi.fn() }));
const testRunResultMock = vi.hoisted(() => ({ updateMany: vi.fn() }));
const fetchMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({ prisma: { testRun: testRunMock, testRunResult: testRunResultMock } }));
vi.stubGlobal("fetch", fetchMock);

import { POST } from "@/app/api/projects/[code]/runs/[runId]/github/dispatch/route";

const routeParams = (code: string, runId: string) => ({ params: Promise.resolve({ code, runId }) });

const fakeRun = {
  id: "run-123",
  status: "PENDING",
  project: {
    id: "proj-1",
    githubToken: "gh-token-abc",
    githubOwner: "my-org",
    githubRepo: "my-repo",
    githubWorkflowId: "playwright.yml",
  },
  results: [
    {
      id: "result-1",
      testCase: {
        id: "abcd1234",
        automationStatus: "AUTOMATED",
      },
    },
    {
      id: "result-2",
      testCase: {
        id: "efgh5678",
        automationStatus: "MANUAL",
      },
    },
  ],
};

describe("POST /api/projects/[code]/runs/[runId]/github/dispatch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.GITHUB_TOKEN;
    delete process.env.GITHUB_OWNER;
    delete process.env.GITHUB_REPO;
  });

  it("returns 404 when test run not found", async () => {
    testRunMock.findUnique.mockResolvedValue(null);

    const req = new Request("http://localhost/api/projects/PROJ/runs/run-999/github/dispatch", {
      method: "POST",
      headers: { host: "localhost" },
    });

    const res = await POST(req, routeParams("PROJ", "run-999"));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Test run not found");
  });

  it("returns 400 when GitHub credentials are missing", async () => {
    const runWithoutCredentials = {
      ...fakeRun,
      project: {
        ...fakeRun.project,
        githubToken: null,
        githubOwner: null,
        githubRepo: null,
      },
    };
    testRunMock.findUnique.mockResolvedValue(runWithoutCredentials);

    const req = new Request("http://localhost/api/projects/PROJ/runs/run-123/github/dispatch", {
      method: "POST",
      headers: { host: "localhost" },
    });

    const res = await POST(req, routeParams("PROJ", "run-123"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/GitHub integration is not configured/);
  });

  it("returns 200 and dispatches to the correct GitHub URL", async () => {
    testRunMock.findUnique.mockResolvedValue(fakeRun);
    testRunMock.update.mockResolvedValue({ ...fakeRun, status: "ACTIVE" });
    testRunResultMock.updateMany.mockResolvedValue({ count: 1 });
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });

    const req = new Request("http://localhost/api/projects/PROJ/runs/run-123/github/dispatch", {
      method: "POST",
      headers: { host: "localhost", "x-forwarded-proto": "https" },
    });

    const res = await POST(req, routeParams("PROJ", "run-123"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://api.github.com/repos/my-org/my-repo/actions/workflows/playwright.yml/dispatches"
    );
    expect(options.method).toBe("POST");
    const parsedBody = JSON.parse(options.body);
    expect(parsedBody.inputs.run_id).toBe("run-123");

    expect(testRunMock.update).toHaveBeenCalledWith({
      where: { id: "run-123" },
      data: { status: "ACTIVE" },
    });
  });

  it("returns 500 when GitHub fetch returns !ok", async () => {
    testRunMock.findUnique.mockResolvedValue(fakeRun);
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ message: "Not Found" }),
    });

    const req = new Request("http://localhost/api/projects/PROJ/runs/run-123/github/dispatch", {
      method: "POST",
      headers: { host: "localhost" },
    });

    const res = await POST(req, routeParams("PROJ", "run-123"));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toMatch(/Failed to trigger GitHub Actions/);
    expect(body.error).toMatch(/Not Found/);
  });

  it("updates automated result statuses to IN_PROGRESS after dispatch", async () => {
    testRunMock.findUnique.mockResolvedValue(fakeRun);
    testRunMock.update.mockResolvedValue({ ...fakeRun, status: "ACTIVE" });
    testRunResultMock.updateMany.mockResolvedValue({ count: 1 });
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });

    const req = new Request("http://localhost/api/projects/PROJ/runs/run-123/github/dispatch", {
      method: "POST",
      headers: { host: "localhost" },
    });

    await POST(req, routeParams("PROJ", "run-123"));

    expect(testRunResultMock.updateMany).toHaveBeenCalledOnce();
    expect(testRunResultMock.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["result-1"] } },
      data: { status: "IN_PROGRESS", comment: null },
    });
  });

  it("skips updateMany when no automated cases exist", async () => {
    const runWithNoAutomated = {
      ...fakeRun,
      results: [
        {
          id: "result-2",
          testCase: {
            id: "efgh5678",
            automationStatus: "MANUAL",
          },
        },
      ],
    };
    testRunMock.findUnique.mockResolvedValue(runWithNoAutomated);
    testRunMock.update.mockResolvedValue({ ...runWithNoAutomated, status: "ACTIVE" });
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });

    const req = new Request("http://localhost/api/projects/PROJ/runs/run-123/github/dispatch", {
      method: "POST",
      headers: { host: "localhost" },
    });

    const res = await POST(req, routeParams("PROJ", "run-123"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(testRunResultMock.updateMany).not.toHaveBeenCalled();
  });
});
