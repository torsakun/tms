import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";

const sessionMock = vi.hoisted(() => ({
  getServerSession: vi.fn(),
}));

vi.mock("next-auth/next", () => ({
  getServerSession: sessionMock.getServerSession,
}));

import { POST as createCase, GET as listCases } from "@/app/api/projects/[code]/cases/route";
import { POST as createSuite } from "@/app/api/projects/[code]/suites/route";
import { POST as createProject } from "@/app/api/projects/route";

const runId = `tc-code-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
const projectCode = `C${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
const projectCode2 = `D${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
const adminEmail = `${runId}@example.com`;

let suiteId = "";
let firstCaseId = "";

function jsonRequest(path: string, body?: unknown) {
  return new Request(`http://localhost${path}`, {
    method: body ? "POST" : "GET",
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { "content-type": "application/json" } : undefined,
  });
}

function routeParams(code: string) {
  return { params: Promise.resolve({ code }) };
}

const caseBody = (suiteId: string, suffix = "") => ({
  title: `Integration Case ${runId}${suffix}`,
  suiteId,
  severity: "NORMAL" as const,
  priority: "MEDIUM" as const,
  automationStatus: "MANUAL" as const,
});

describe("test case code — integration tests", () => {
  beforeAll(async () => {
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: "TC Code Admin",
        passwordHash: "not-used",
        role: "ADMIN",
      },
    });

    sessionMock.getServerSession.mockResolvedValue({
      user: { id: admin.id, email: admin.email, role: "ADMIN" },
    });

    // Create project 1
    await createProject(jsonRequest("/api/projects", {
      name: `TC Code Project ${runId}`,
      code: projectCode,
    }));

    // Create suite
    const suiteRes = await createSuite(
      jsonRequest(`/api/projects/${projectCode}/suites`, { title: `Suite ${runId}` }),
      routeParams(projectCode)
    );
    const suite = await suiteRes.json();
    suiteId = suite.id;
  });

  afterAll(async () => {
    await prisma.project.deleteMany({ where: { code: { in: [projectCode, projectCode2] } } });
    await prisma.user.deleteMany({ where: { email: adminEmail } });
    await prisma.$disconnect();
  });

  it("first test case receives sequenceNumber 1 (code {PROJECT_CODE}-001)", async () => {
    const response = await createCase(
      jsonRequest(`/api/projects/${projectCode}/cases`, caseBody(suiteId)),
      routeParams(projectCode)
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.sequenceNumber).toBe(1);
    firstCaseId = body.id;
  });

  it("second test case receives sequenceNumber 2 (code {PROJECT_CODE}-002)", async () => {
    const response = await createCase(
      jsonRequest(`/api/projects/${projectCode}/cases`, caseBody(suiteId, "-B")),
      routeParams(projectCode)
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.sequenceNumber).toBe(2);
  });

  it("GET /cases returns sequenceNumber for every case", async () => {
    const response = await listCases(
      jsonRequest(`/api/projects/${projectCode}/cases`),
      routeParams(projectCode)
    );
    const cases = await response.json();

    expect(response.status).toBe(200);
    expect(cases.length).toBeGreaterThanOrEqual(2);
    cases.forEach((tc: any) => {
      expect(typeof tc.sequenceNumber).toBe("number");
      expect(tc.sequenceNumber).toBeGreaterThanOrEqual(1);
    });
  });

  it("sequences are project-scoped — a second project also starts from 1", async () => {
    // Create project 2 with its own suite
    await createProject(jsonRequest("/api/projects", {
      name: `TC Code Project 2 ${runId}`,
      code: projectCode2,
    }));

    const suiteRes = await createSuite(
      jsonRequest(`/api/projects/${projectCode2}/suites`, { title: `Suite2 ${runId}` }),
      routeParams(projectCode2)
    );
    const suite2 = await suiteRes.json();

    const response = await createCase(
      jsonRequest(`/api/projects/${projectCode2}/cases`, caseBody(suite2.id)),
      routeParams(projectCode2)
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.sequenceNumber).toBe(1);
  });

  it("sequenceNumber persists after re-fetching the case list", async () => {
    const response = await listCases(
      jsonRequest(`/api/projects/${projectCode}/cases`),
      routeParams(projectCode)
    );
    const cases = await response.json();

    const found = cases.find((tc: any) => tc.id === firstCaseId);
    expect(found).toBeDefined();
    expect(found.sequenceNumber).toBe(1);
  });
});
