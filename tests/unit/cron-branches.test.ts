import { beforeEach, describe, expect, it, vi } from "vitest";

const pipelineScheduleMock = vi.hoisted(() => ({ findMany: vi.fn() }));
const testCaseMock = vi.hoisted(() => ({ findMany: vi.fn() }));
const testRunMock = vi.hoisted(() => ({ create: vi.fn() }));
const fetchMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  prisma: {
    pipelineSchedule: pipelineScheduleMock,
    testCase: testCaseMock,
    testRun: testRunMock,
  },
}));
vi.stubGlobal("fetch", fetchMock);

import { POST } from "@/app/api/cron/process-schedules/route";

const CRON_SECRET = "super-secret-dev-key";

function makeRequest(authHeader?: string) {
  return new Request("http://localhost/api/cron/process-schedules", {
    method: "POST",
    headers: authHeader ? { authorization: authHeader } : {},
  });
}

const fakeProject = {
  id: "proj-fin",
  code: "FIN",
  githubToken: "gh-token",
  githubOwner: "acme",
  githubRepo: "tests",
  githubWorkflowId: "playwright.yml",
};

// Due schedule: 5 seconds ago (within 60s window)
function makeDueSchedule(overrides = {}) {
  return {
    id: "sched-001",
    title: "Nightly Run",
    cron: "* * * * *", // every minute — always due within 60s
    isActive: true,
    project: fakeProject,
    ...overrides,
  };
}

describe("POST /api/cron/process-schedules", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when Authorization header is missing", async () => {
    const res = await POST(makeRequest());

    expect(res.status).toBe(401);
    expect(pipelineScheduleMock.findMany).not.toHaveBeenCalled();
  });

  it("returns 401 when Authorization header is wrong", async () => {
    const res = await POST(makeRequest("Bearer wrong-secret"));

    expect(res.status).toBe(401);
  });

  it("returns 200 with 0 triggered when no active schedules", async () => {
    pipelineScheduleMock.findMany.mockResolvedValue([]);

    const res = await POST(makeRequest(`Bearer ${CRON_SECRET}`));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.triggeredCount).toBe(0);
  });

  it("skips schedule when GitHub credentials are missing", async () => {
    pipelineScheduleMock.findMany.mockResolvedValue([
      makeDueSchedule({ project: { ...fakeProject, githubToken: null } }),
    ]);

    const res = await POST(makeRequest(`Bearer ${CRON_SECRET}`));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(testRunMock.create).not.toHaveBeenCalled();
  });

  it("skips schedule when no automated test cases found", async () => {
    pipelineScheduleMock.findMany.mockResolvedValue([makeDueSchedule()]);
    testCaseMock.findMany.mockResolvedValue([]);

    const res = await POST(makeRequest(`Bearer ${CRON_SECRET}`));

    expect(res.status).toBe(200);
    expect(testRunMock.create).not.toHaveBeenCalled();
  });

  it("creates test run and triggers GitHub when schedule is due", async () => {
    pipelineScheduleMock.findMany.mockResolvedValue([makeDueSchedule()]);
    testCaseMock.findMany.mockResolvedValue([{ id: "tc-001" }]);
    testRunMock.create.mockResolvedValue({ id: "run-001" });
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });

    const res = await POST(makeRequest(`Bearer ${CRON_SECRET}`));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(testRunMock.create).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("api.github.com"),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("continues to next schedule when GitHub dispatch fails", async () => {
    pipelineScheduleMock.findMany.mockResolvedValue([makeDueSchedule(), makeDueSchedule({ id: "sched-002" })]);
    testCaseMock.findMany.mockResolvedValue([{ id: "tc-001" }]);
    testRunMock.create.mockResolvedValue({ id: "run-001" });
    fetchMock
      .mockResolvedValueOnce({ ok: false, status: 422, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    const res = await POST(makeRequest(`Bearer ${CRON_SECRET}`));

    expect(res.status).toBe(200);
    // Both schedules processed; second one should have a second run created
    expect(testRunMock.create).toHaveBeenCalledTimes(2);
  });
});
