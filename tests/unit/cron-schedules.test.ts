import { beforeEach, describe, expect, it, vi } from "vitest";

const pipelineScheduleMock = vi.hoisted(() => ({ findMany: vi.fn() }));
const testRunMock = vi.hoisted(() => ({ create: vi.fn() }));
const testCaseMock = vi.hoisted(() => ({ findMany: vi.fn() }));
const fetchMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  prisma: {
    pipelineSchedule: pipelineScheduleMock,
    testRun: testRunMock,
    testCase: testCaseMock,
  },
}));

vi.stubGlobal("fetch", fetchMock);

import { POST } from "@/app/api/cron/process-schedules/route";

const CRON_SECRET = "super-secret-dev-key";

function makeRequest(secret?: string) {
  return new Request("http://localhost/api/cron/process-schedules", {
    method: "POST",
    headers: secret ? { authorization: `Bearer ${secret}` } : {},
  });
}

const fakeProject = {
  id: "proj-fin", code: "FIN",
  githubToken: "gh-token", githubOwner: "acme", githubRepo: "tests",
  githubWorkflowId: "playwright.yml",
};

const fakeSchedule = {
  id: "sched-001",
  title: "Nightly",
  cron: "0 0 * * *", // midnight — won't be "due" in tests
  isActive: true,
  project: fakeProject,
};

describe("POST /api/cron/process-schedules", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when bearer token is missing", async () => {
    const res = await POST(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(pipelineScheduleMock.findMany).not.toHaveBeenCalled();
  });

  it("returns 401 when bearer token is wrong", async () => {
    const res = await POST(makeRequest("wrong-secret"));

    expect(res.status).toBe(401);
  });

  it("processes schedules and returns count when no schedules are due", async () => {
    pipelineScheduleMock.findMany.mockResolvedValue([fakeSchedule]);

    const res = await POST(makeRequest(CRON_SECRET));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.processed).toBe(1);
    expect(body.triggeredCount).toBe(0);
  });

  it("returns success with empty triggered list when no active schedules exist", async () => {
    pipelineScheduleMock.findMany.mockResolvedValue([]);

    const res = await POST(makeRequest(CRON_SECRET));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.processed).toBe(0);
    expect(body.triggeredRunIds).toEqual([]);
  });

  it("skips schedule when GitHub credentials are missing", async () => {
    const scheduleNoGitHub = {
      ...fakeSchedule,
      cron: "* * * * *", // every minute — always due
      project: { ...fakeProject, githubToken: null, githubOwner: null, githubRepo: null },
    };
    pipelineScheduleMock.findMany.mockResolvedValue([scheduleNoGitHub]);
    testCaseMock.findMany.mockResolvedValue([{ id: "case-001" }]);

    const res = await POST(makeRequest(CRON_SECRET));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.triggeredCount).toBe(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
