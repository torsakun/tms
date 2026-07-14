import { beforeEach, describe, expect, it, vi } from "vitest";

const projectMock = vi.hoisted(() => ({
  findUnique: vi.fn(),
  findFirst: vi.fn(),
}));

const userMock = vi.hoisted(() => ({
  findMany: vi.fn(),
}));

const environmentMock = vi.hoisted(() => ({
  findMany: vi.fn(),
  create: vi.fn(),
}));

const testPlanMock = vi.hoisted(() => ({
  findMany: vi.fn(),
  create: vi.fn(),
}));

const suiteMock = vi.hoisted(() => ({
  findMany: vi.fn(),
  create: vi.fn(),
}));

const sessionMock = vi.hoisted(() => ({
  getServerSession: vi.fn(),
}));

const requireProjectRoleMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  prisma: {
    project: projectMock,
    user: userMock,
    environment: environmentMock,
    testPlan: testPlanMock,
    testSuite: suiteMock,
  },
}));

vi.mock("next-auth/next", () => ({
  getServerSession: sessionMock.getServerSession,
}));

vi.mock("@/lib/project-auth", () => ({
  requireProjectRole: requireProjectRoleMock,
}));

vi.mock("@/lib/auth", () => ({ authOptions: {} }));

import { GET as getMembers } from "@/app/api/projects/[code]/members/route";
import { GET as getEnvironments, POST as createEnvironment } from "@/app/api/projects/[code]/environments/route";
import { GET as getPlans, POST as createPlan } from "@/app/api/projects/[code]/plans/route";
import { GET as getSuites, POST as createSuite } from "@/app/api/projects/[code]/suites/route";

const routeParams = (code: string) => ({ params: Promise.resolve({ code }) });

function jsonRequest(method: string, url: string, body?: unknown) {
  return new Request(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { "content-type": "application/json" } : undefined,
  });
}

const fakeProject = { id: "proj-fin", code: "FIN", name: "FinPay" };
const fakeUser = { id: "user-001", email: "admin@example.com", role: "ADMIN" };

// ─── Members ──────────────────────────────────────────────────────────────────

describe("GET /api/projects/[code]/members", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 404 when project not found", async () => {
    projectMock.findUnique.mockResolvedValue(null);

    const res = await getMembers(
      new Request("http://localhost/api/projects/NOTEXIST/members"),
      routeParams("NOTEXIST")
    );

    expect(res.status).toBe(404);
  });

  it("returns list of users for the project", async () => {
    projectMock.findUnique.mockResolvedValue({
      id: "proj-fin",
      members: [
        { role: "ADMIN", user: { id: "u1", name: "Alice", email: "alice@example.com", role: "ADMIN" } },
        { role: "VIEWER", user: { id: "u2", name: "Bob", email: "bob@example.com", role: "MEMBER" } },
      ],
    });

    const res = await getMembers(
      new Request("http://localhost/api/projects/FIN/members"),
      routeParams("FIN")
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveLength(2);
    expect(body[0].email).toBe("alice@example.com");
  });
});

// ─── Environments ─────────────────────────────────────────────────────────────

describe("GET /api/projects/[code]/environments", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 404 when project not found", async () => {
    projectMock.findUnique.mockResolvedValue(null);

    const res = await getEnvironments(
      new Request("http://localhost/api/projects/NOTEXIST/environments"),
      routeParams("NOTEXIST")
    );

    expect(res.status).toBe(404);
  });

  it("returns list of environments", async () => {
    projectMock.findUnique.mockResolvedValue(fakeProject);
    environmentMock.findMany.mockResolvedValue([
      { id: "env-1", title: "Staging", slug: "staging" },
    ]);

    const res = await getEnvironments(
      new Request("http://localhost/api/projects/FIN/environments"),
      routeParams("FIN")
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body[0].slug).toBe("staging");
  });
});

describe("POST /api/projects/[code]/environments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionMock.getServerSession.mockResolvedValue({ user: fakeUser });
    requireProjectRoleMock.mockResolvedValue(true);
  });

  it("creates environment and returns 201", async () => {
    projectMock.findUnique.mockResolvedValue(fakeProject);
    environmentMock.create.mockResolvedValue({ id: "env-2", title: "Production", slug: "production", projectId: "proj-fin" });

    const res = await createEnvironment(
      jsonRequest("POST", "http://localhost/api/projects/FIN/environments", { title: "Production", slug: "production" }),
      routeParams("FIN")
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.slug).toBe("production");
  });

  it("auto-generates slug from title when slug is omitted", async () => {
    projectMock.findUnique.mockResolvedValue(fakeProject);
    environmentMock.create.mockResolvedValue({ id: "env-3", title: "UAT Env", slug: "uat-env" });

    await createEnvironment(
      jsonRequest("POST", "http://localhost/api/projects/FIN/environments", { title: "UAT Env" }),
      routeParams("FIN")
    );

    expect(environmentMock.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ slug: "uat-env" }) })
    );
  });
});

// ─── Plans ────────────────────────────────────────────────────────────────────

describe("GET /api/projects/[code]/plans", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 404 when project not found", async () => {
    projectMock.findUnique.mockResolvedValue(null);

    const res = await getPlans(
      new Request("http://localhost/api/projects/NOTEXIST/plans"),
      routeParams("NOTEXIST")
    );

    expect(res.status).toBe(404);
  });

  it("returns list of plans", async () => {
    projectMock.findUnique.mockResolvedValue(fakeProject);
    testPlanMock.findMany.mockResolvedValue([
      { id: "plan-1", title: "Sprint 1", _count: { testCases: 5, testRuns: 1 } },
    ]);

    const res = await getPlans(
      new Request("http://localhost/api/projects/FIN/plans"),
      routeParams("FIN")
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body[0].title).toBe("Sprint 1");
  });
});

describe("POST /api/projects/[code]/plans", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionMock.getServerSession.mockResolvedValue({ user: fakeUser });
    requireProjectRoleMock.mockResolvedValue(true);
  });

  it("returns 400 when title is missing", async () => {
    const res = await createPlan(
      jsonRequest("POST", "http://localhost/api/projects/FIN/plans", { caseIds: [] }),
      routeParams("FIN")
    );

    expect(res.status).toBe(400);
    expect(testPlanMock.create).not.toHaveBeenCalled();
  });

  it("creates plan with connected cases and returns 201", async () => {
    projectMock.findUnique.mockResolvedValue(fakeProject);
    testPlanMock.create.mockResolvedValue({
      id: "plan-2", title: "Regression", testCases: [], _count: { testCases: 2, testRuns: 0 }
    });

    const res = await createPlan(
      jsonRequest("POST", "http://localhost/api/projects/FIN/plans", {
        title: "Regression", caseIds: ["case-001", "case-002"]
      }),
      routeParams("FIN")
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.title).toBe("Regression");
    expect(testPlanMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          testCases: { connect: [{ id: "case-001" }, { id: "case-002" }] }
        })
      })
    );
  });
});

// ─── Suites ───────────────────────────────────────────────────────────────────

describe("GET /api/projects/[code]/suites", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns empty array when project not found", async () => {
    projectMock.findFirst.mockResolvedValue(null);

    const res = await getSuites(
      new Request("http://localhost/api/projects/NOTEXIST/suites"),
      routeParams("NOTEXIST")
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual([]);
  });

  it("returns list of suites", async () => {
    projectMock.findFirst.mockResolvedValue(fakeProject);
    suiteMock.findMany.mockResolvedValue([
      { id: "suite-1", title: "Login", position: 0 },
    ]);

    const res = await getSuites(
      new Request("http://localhost/api/projects/FIN/suites"),
      routeParams("FIN")
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body[0].title).toBe("Login");
  });
});

describe("POST /api/projects/[code]/suites", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    projectMock.findFirst.mockResolvedValue(fakeProject);
    requireProjectRoleMock.mockResolvedValue(true);
  });

  it("returns 401 when not authenticated", async () => {
    sessionMock.getServerSession.mockResolvedValue(null);

    const res = await createSuite(
      jsonRequest("POST", "http://localhost/api/projects/FIN/suites", { title: "Auth Suite" }),
      routeParams("FIN")
    );

    expect(res.status).toBe(401);
    expect(suiteMock.create).not.toHaveBeenCalled();
  });

  it("creates suite and returns 201", async () => {
    sessionMock.getServerSession.mockResolvedValue({ user: fakeUser });
    suiteMock.create.mockResolvedValue({ id: "suite-2", title: "Auth Suite", projectId: "proj-fin" });

    const res = await createSuite(
      jsonRequest("POST", "http://localhost/api/projects/FIN/suites", { title: "Auth Suite" }),
      routeParams("FIN")
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.title).toBe("Auth Suite");
  });
});
