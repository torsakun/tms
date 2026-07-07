import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { prisma } from "@/lib/prisma";
import { requireProjectAccess } from "@/lib/project-route-auth";
import { GET, POST } from "@/app/api/projects/[code]/pipelines/route";
import { DELETE, PATCH } from "@/app/api/projects/[code]/pipelines/[id]/route";
import { POST as triggerPipeline } from "@/app/api/projects/[code]/pipelines/[id]/trigger/route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    project: {
      findUnique: vi.fn(),
    },
    pipelineSchedule: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    testPlan: {
      findFirst: vi.fn(),
    },
    testRun: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    testCase: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/project-route-auth", () => ({
  requireProjectAccess: vi.fn(),
}));

const mockedRequireProjectAccess = vi.mocked(requireProjectAccess);

const projectFindUnique = prisma.project.findUnique as unknown as Mock;
const pipelineFindMany = prisma.pipelineSchedule.findMany as unknown as Mock;
const pipelineFindFirst = prisma.pipelineSchedule.findFirst as unknown as Mock;
const pipelineCreate = prisma.pipelineSchedule.create as unknown as Mock;
const pipelineUpdate = prisma.pipelineSchedule.update as unknown as Mock;
const pipelineDelete = prisma.pipelineSchedule.delete as unknown as Mock;
const planFindFirst = prisma.testPlan.findFirst as unknown as Mock;
const testRunFindMany = prisma.testRun.findMany as unknown as Mock;
const testRunCreate = prisma.testRun.create as unknown as Mock;
const testCaseFindMany = prisma.testCase.findMany as unknown as Mock;

const params = (code = "PRO", id = "pipeline-1") => ({
  params: Promise.resolve({ code, id }),
});
const req = (body?: unknown, method = "POST") =>
  new Request("http://qmaster.test/api/projects/PRO/pipelines", {
    method,
    headers: {
      "content-type": "application/json",
      host: "qmaster.test",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
const json = async (response: Response) => response.json() as Promise<Record<string, unknown>>;

describe("project pipeline API routes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedRequireProjectAccess.mockResolvedValue({ userId: "user-1", userRole: "USER" });
    projectFindUnique.mockResolvedValue({
      id: "project-1",
      code: "PRO",
      githubOwner: null,
      githubRepo: null,
      githubToken: null,
      githubWorkflowId: null,
    });
    pipelineFindMany.mockResolvedValue([
      { id: "pipeline-1", title: "Nightly", createdAt: new Date("2026-01-01") },
    ]);
    testRunFindMany.mockResolvedValue([
      {
        id: "run-1",
        title: "Scheduled Run: Nightly",
        status: "COMPLETED",
        createdAt: new Date("2026-01-02"),
        updatedAt: new Date("2026-01-03"),
        results: [{ status: "PASSED" }, { status: "FAILED" }],
      },
    ]);
    planFindFirst.mockResolvedValue({ id: "plan-1" });
    pipelineCreate.mockResolvedValue({
      id: "pipeline-1",
      title: "Nightly",
      cron: "0 0 * * *",
      isActive: true,
    });
    pipelineFindFirst.mockResolvedValue({
      id: "pipeline-1",
      title: "Nightly",
      cron: "0 0 * * *",
      isActive: true,
      planId: null,
    });
    pipelineUpdate.mockResolvedValue({
      id: "pipeline-1",
      title: "Nightly",
      cron: "0 1 * * *",
      isActive: false,
    });
    pipelineDelete.mockResolvedValue({});
    testCaseFindMany.mockResolvedValue([{ id: "case-1234" }]);
    testRunCreate.mockResolvedValue({ id: "run-1" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 200 })));
  });

  it("adds last run pass rate to listed pipelines", async () => {
    const response = await GET(req(undefined, "GET"), { params: Promise.resolve({ code: "PRO" }) });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject([
      {
        id: "pipeline-1",
        lastRun: {
          id: "run-1",
          passRate: 50,
        },
      },
    ]);
  });

  it("validates title and cron before creating pipelines", async () => {
    const titleResponse = await POST(req({ title: "", cron: "0 0 * * *" }), { params: Promise.resolve({ code: "PRO" }) });
    const cronResponse = await POST(req({ title: "Nightly", cron: "" }), { params: Promise.resolve({ code: "PRO" }) });

    expect(titleResponse.status).toBe(400);
    expect(await json(titleResponse)).toEqual({ error: "Title is required" });
    expect(cronResponse.status).toBe(400);
    expect(await json(cronResponse)).toEqual({ error: "Cron is required" });
  });

  it("validates selected test plan belongs to the project", async () => {
    planFindFirst.mockResolvedValue(null);

    const response = await POST(
      req({ title: "Nightly", cron: "0 0 * * *", planId: "missing-plan" }),
      { params: Promise.resolve({ code: "PRO" }) },
    );

    expect(response.status).toBe(400);
    expect(await json(response)).toEqual({ error: "Test plan not found" });
    expect(pipelineCreate).not.toHaveBeenCalled();
  });

  it("creates pipelines with trimmed fields and selected plan", async () => {
    const response = await POST(
      req({ title: " Nightly ", description: "Daily", cron: " 0 0 * * * ", planId: "plan-1", activateImmediately: false }),
      { params: Promise.resolve({ code: "PRO" }) },
    );

    expect(response.status).toBe(201);
    expect(pipelineCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: "Nightly",
          cron: "0 0 * * *",
          isActive: false,
          projectId: "project-1",
          planId: "plan-1",
        }),
      }),
    );
  });

  it("updates and deletes pipeline records scoped to a project", async () => {
    const patchResponse = await PATCH(req({ isActive: false, cron: "0 1 * * *" }, "PATCH"), params());
    const deleteResponse = await DELETE(req(undefined, "DELETE"), params());

    expect(patchResponse.status).toBe(200);
    expect(pipelineUpdate).toHaveBeenCalledWith({
      where: { id: "pipeline-1" },
      data: { isActive: false, cron: "0 1 * * *" },
    });
    expect(deleteResponse.status).toBe(200);
    expect(pipelineDelete).toHaveBeenCalledWith({ where: { id: "pipeline-1" } });
  });

  it("blocks trigger for inactive pipelines", async () => {
    pipelineFindFirst.mockResolvedValue({ id: "pipeline-1", isActive: false });

    const response = await triggerPipeline(req(undefined, "POST"), params());

    expect(response.status).toBe(400);
    expect(await json(response)).toEqual({ error: "Pipeline is inactive" });
  });

  it("blocks trigger when GitHub integration is missing", async () => {
    const response = await triggerPipeline(req(undefined, "POST"), params());

    expect(response.status).toBe(400);
    expect(await json(response)).toEqual({ error: "GitHub integration is not configured" });
  });

  it("creates scheduled run and dispatches GitHub workflow", async () => {
    projectFindUnique.mockResolvedValue({
      id: "project-1",
      code: "PRO",
      githubOwner: "owner",
      githubRepo: "repo",
      githubToken: "token",
      githubWorkflowId: "playwright.yml",
    });

    const response = await triggerPipeline(req(undefined, "POST"), params());

    expect(response.status).toBe(200);
    expect(await json(response)).toEqual({ success: true, runId: "run-1" });
    expect(testRunCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: "Scheduled Run: Nightly",
          results: {
            create: [{ caseId: "case-1234", status: "IN_PROGRESS" }],
          },
        }),
      }),
    );
    expect(fetch).toHaveBeenCalledWith(
      "https://api.github.com/repos/owner/repo/actions/workflows/playwright.yml/dispatches",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
