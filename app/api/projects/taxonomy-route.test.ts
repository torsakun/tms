import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { prisma } from "@/lib/prisma";
import { requireProjectAccess } from "@/lib/project-route-auth";
import { GET as listEnvs, POST as createEnv } from "@/app/api/projects/[code]/environments/route";
import { DELETE as deleteEnv, PATCH as updateEnv } from "@/app/api/projects/[code]/environments/[id]/route";
import { GET as listTags, POST as createTag } from "@/app/api/projects/[code]/tags/route";
import { GET as listSharedSteps, POST as createSharedStep } from "@/app/api/projects/[code]/shared-steps/route";
import { DELETE as deleteSharedStep, PATCH as updateSharedStep } from "@/app/api/projects/[code]/shared-steps/[id]/route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    project: { findUnique: vi.fn() },
    environment: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    tag: { findMany: vi.fn(), create: vi.fn() },
    sharedStep: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  },
}));

vi.mock("@/lib/project-route-auth", () => ({
  requireProjectAccess: vi.fn(),
}));

const mockedRequireProjectAccess = vi.mocked(requireProjectAccess);

const projectFindUnique = prisma.project.findUnique as unknown as Mock;
const envFindMany = prisma.environment.findMany as unknown as Mock;
const envCreate = prisma.environment.create as unknown as Mock;
const envUpdate = prisma.environment.update as unknown as Mock;
const envDelete = prisma.environment.delete as unknown as Mock;
const tagFindMany = prisma.tag.findMany as unknown as Mock;
const tagCreate = prisma.tag.create as unknown as Mock;
const sharedStepFindMany = prisma.sharedStep.findMany as unknown as Mock;
const sharedStepCreate = prisma.sharedStep.create as unknown as Mock;
const sharedStepUpdate = prisma.sharedStep.update as unknown as Mock;
const sharedStepDelete = prisma.sharedStep.delete as unknown as Mock;

const params = (code = "PRO", id = "entity-1") => ({ params: Promise.resolve({ code, id }) });
const codeParams = (code = "PRO") => ({ params: Promise.resolve({ code }) });
const req = (body?: unknown, method = "POST") =>
  new Request("http://qmaster.test/api/projects/PRO", { method, headers: { "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
const json = async (response: Response) => response.json() as Promise<Record<string, unknown>>;

describe("project taxonomy routes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedRequireProjectAccess.mockResolvedValue({ userId: "user-1", userRole: "USER" });
    projectFindUnique.mockResolvedValue({ id: "project-1", code: "PRO", environments: [] });
    envFindMany.mockResolvedValue([{ id: "env-1", title: "Staging" }]);
    envCreate.mockResolvedValue({ id: "env-1", title: "Staging", slug: "staging" });
    envUpdate.mockResolvedValue({ id: "env-1", title: "QA" });
    envDelete.mockResolvedValue({});
    tagFindMany.mockResolvedValue([{ id: "tag-1", name: "smoke" }]);
    tagCreate.mockResolvedValue({ id: "tag-1", name: "smoke" });
    sharedStepFindMany.mockResolvedValue([{ id: "step-1", title: "Login" }]);
    sharedStepCreate.mockResolvedValue({ id: "step-1", title: "Login" });
    sharedStepUpdate.mockResolvedValue({ id: "step-1", title: "Login+" });
    sharedStepDelete.mockResolvedValue({});
  });

  it("lists and creates environments with generated slug", async () => {
    const list = await listEnvs(req(undefined, "GET"), codeParams());
    const created = await createEnv(req({ title: "QA Env", description: "Test" }), codeParams());
    expect(list.status).toBe(200);
    expect(await list.json()).toEqual([{ id: "env-1", title: "Staging" }]);
    expect(created.status).toBe(201);
    expect(envCreate).toHaveBeenCalledWith({ data: { title: "QA Env", description: "Test", slug: "qa-env", projectId: "project-1" } });
  });

  it("updates and deletes environments", async () => {
    const patch = await updateEnv(req({ title: "QA" }, "PATCH"), params("PRO", "env-1"));
    const del = await deleteEnv(req(undefined, "DELETE"), params("PRO", "env-1"));
    expect(patch.status).toBe(200);
    expect(del.status).toBe(200);
    expect(envUpdate).toHaveBeenCalledWith({ where: { id: "env-1" }, data: { title: "QA" } });
    expect(envDelete).toHaveBeenCalledWith({ where: { id: "env-1" } });
  });

  it("lists, creates, validates, and de-duplicates tags", async () => {
    const list = await listTags(req(undefined, "GET"), codeParams());
    const invalid = await createTag(req({ name: "" }), codeParams());
    tagCreate.mockRejectedValueOnce({ code: "P2002" });
    const duplicate = await createTag(req({ name: "smoke" }), codeParams());
    expect(list.status).toBe(200);
    expect(invalid.status).toBe(400);
    expect(duplicate.status).toBe(409);
    expect(await json(duplicate)).toEqual({ error: "Tag already exists in this project" });
  });

  it("lists and creates shared steps scoped by project", async () => {
    const list = await listSharedSteps(req(undefined, "GET"), codeParams());
    const created = await createSharedStep(req({ title: "Login", action: "Enter email", expectedResult: "Signed in" }), codeParams());
    expect(list.status).toBe(200);
    expect(created.status).toBe(201);
    expect(sharedStepCreate).toHaveBeenCalledWith({ data: { title: "Login", action: "Enter email", expectedResult: "Signed in", projectId: "project-1" } });
  });

  it("updates and deletes shared steps", async () => {
    const patch = await updateSharedStep(req({ title: "Login+" }, "PATCH"), params("PRO", "step-1"));
    const del = await deleteSharedStep(req(undefined, "DELETE"), params("PRO", "step-1"));
    expect(patch.status).toBe(200);
    expect(del.status).toBe(200);
    expect(sharedStepUpdate).toHaveBeenCalledWith({ where: { id: "step-1" }, data: { title: "Login+" } });
    expect(sharedStepDelete).toHaveBeenCalledWith({ where: { id: "step-1" } });
  });
});
