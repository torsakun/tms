import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { prisma } from "@/lib/prisma";
import { requireProjectAccess } from "@/lib/project-route-auth";
import { GET as listPlans, POST as createPlan } from "@/app/api/projects/[code]/plans/route";
import { DELETE as deletePlan, GET as getPlan, PUT as updatePlan } from "@/app/api/projects/[code]/plans/[planId]/route";
import { GET as listMilestones, POST as createMilestone } from "@/app/api/projects/[code]/milestones/route";
import { DELETE as deleteMilestone, PATCH as updateMilestone } from "@/app/api/projects/[code]/milestones/[id]/route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    project: {
      findUnique: vi.fn(),
    },
    testPlan: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    milestone: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("@/lib/project-route-auth", () => ({
  requireProjectAccess: vi.fn(),
}));

const mockedRequireProjectAccess = vi.mocked(requireProjectAccess);

const projectFindUnique = prisma.project.findUnique as unknown as Mock;
const testPlanFindMany = prisma.testPlan.findMany as unknown as Mock;
const testPlanFindUnique = prisma.testPlan.findUnique as unknown as Mock;
const testPlanCreate = prisma.testPlan.create as unknown as Mock;
const testPlanUpdate = prisma.testPlan.update as unknown as Mock;
const testPlanDelete = prisma.testPlan.delete as unknown as Mock;
const milestoneFindMany = prisma.milestone.findMany as unknown as Mock;
const milestoneCreate = prisma.milestone.create as unknown as Mock;
const milestoneUpdate = prisma.milestone.update as unknown as Mock;
const milestoneDelete = prisma.milestone.delete as unknown as Mock;

const planParams = (code = "PRO", planId = "plan-1") => ({
  params: Promise.resolve({ code, planId }),
});
const milestoneParams = (code = "PRO", id = "milestone-1") => ({
  params: Promise.resolve({ code, id }),
});
const req = (body?: unknown, method = "POST") =>
  new Request("http://qmaster.test/api/projects/PRO", {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
const json = async (response: Response) => response.json() as Promise<Record<string, unknown>>;

describe("plans and milestones API routes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedRequireProjectAccess.mockResolvedValue({ userId: "user-1", userRole: "USER" });
    projectFindUnique.mockResolvedValue({ id: "project-1", code: "PRO" });
    testPlanFindMany.mockResolvedValue([{ id: "plan-1", title: "Smoke" }]);
    testPlanFindUnique.mockResolvedValue({ id: "plan-1", title: "Smoke" });
    testPlanCreate.mockResolvedValue({ id: "plan-1", title: "Smoke" });
    testPlanUpdate.mockResolvedValue({ id: "plan-1", title: "Regression" });
    testPlanDelete.mockResolvedValue({});
    milestoneFindMany.mockResolvedValue([{ id: "milestone-1", title: "Release 1" }]);
    milestoneCreate.mockResolvedValue({ id: "milestone-1", title: "Release 1" });
    milestoneUpdate.mockResolvedValue({ id: "milestone-1", title: "Release 1.1" });
    milestoneDelete.mockResolvedValue({});
  });

  it("returns 404 when listing plans for a missing project", async () => {
    projectFindUnique.mockResolvedValue(null);

    const response = await listPlans(req(), planParams("MISS"));

    expect(response.status).toBe(404);
    expect(await json(response)).toEqual({ error: "Project not found" });
  });

  it("creates plans with connected case ids", async () => {
    const response = await createPlan(
      req({ title: "Smoke", description: "Daily", caseIds: ["case-1", "case-2"] }),
      planParams(),
    );

    expect(response.status).toBe(201);
    expect(testPlanCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          projectId: "project-1",
          testCases: { connect: [{ id: "case-1" }, { id: "case-2" }] },
        }),
      }),
    );
  });

  it("validates plan title on create and required fields on update", async () => {
    const createResponse = await createPlan(req({ title: "" }), planParams());
    const updateResponse = await updatePlan(req({ title: "Regression" }, "PUT"), planParams());

    expect(createResponse.status).toBe(400);
    expect(await json(createResponse)).toEqual({ error: "Title is required" });
    expect(updateResponse.status).toBe(400);
    expect(await json(updateResponse)).toEqual({ error: "Missing required fields" });
  });

  it("returns 404 for missing plan details and deletes existing plans", async () => {
    testPlanFindUnique.mockResolvedValue(null);

    const getResponse = await getPlan(req(), planParams());
    const deleteResponse = await deletePlan(req(undefined, "DELETE"), planParams());

    expect(getResponse.status).toBe(404);
    expect(await json(getResponse)).toEqual({ error: "Plan not found" });
    expect(deleteResponse.status).toBe(200);
    expect(await json(deleteResponse)).toEqual({ success: true });
    expect(testPlanDelete).toHaveBeenCalledWith({ where: { id: "plan-1" } });
  });

  it("lists and creates milestones scoped by project code", async () => {
    const listResponse = await listMilestones(req(), { params: Promise.resolve({ code: "PRO" }) });
    const createResponse = await createMilestone(
      req({ title: "Release 1", description: "Launch", dueDate: "2026-07-01T00:00:00.000Z" }),
      { params: Promise.resolve({ code: "PRO" }) },
    );

    expect(listResponse.status).toBe(200);
    expect(await listResponse.json()).toEqual([{ id: "milestone-1", title: "Release 1" }]);
    expect(createResponse.status).toBe(201);
    expect(milestoneCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: "Release 1",
        dueDate: new Date("2026-07-01T00:00:00.000Z"),
        projectId: "project-1",
      }),
    });
  });

  it("updates and deletes milestones using project-code scoped where clauses", async () => {
    const patchResponse = await updateMilestone(
      req({ title: "Release 1.1", dueDate: null, status: "DONE" }, "PATCH"),
      milestoneParams(),
    );
    const deleteResponse = await deleteMilestone(req(undefined, "DELETE"), milestoneParams());

    expect(patchResponse.status).toBe(200);
    expect(milestoneUpdate).toHaveBeenCalledWith({
      where: { id: "milestone-1", project: { code: "PRO" } },
      data: { title: "Release 1.1", dueDate: null, status: "DONE" },
    });
    expect(deleteResponse.status).toBe(200);
    expect(milestoneDelete).toHaveBeenCalledWith({
      where: { id: "milestone-1", project: { code: "PRO" } },
    });
  });
});
