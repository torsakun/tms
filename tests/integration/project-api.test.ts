import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";

const sessionMock = vi.hoisted(() => ({
  getServerSession: vi.fn()
}));

vi.mock("next-auth/next", () => ({
  getServerSession: sessionMock.getServerSession
}));

import { POST as createProject } from "@/app/api/projects/route";
import { GET as listSuites, POST as createSuite } from "@/app/api/projects/[code]/suites/route";
import { GET as listCases, POST as createCase } from "@/app/api/projects/[code]/cases/route";

const runId = `int-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const projectCode = `I${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
const adminEmail = `${runId}@example.com`;
let adminUserId = "";
let suiteId = "";

function jsonRequest(path: string, body?: unknown) {
  return new Request(`http://localhost${path}`, {
    method: body ? "POST" : "GET",
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { "content-type": "application/json" } : undefined
  });
}

function routeParams(code: string) {
  return { params: Promise.resolve({ code }) };
}

describe("project API integration smoke", () => {
  beforeAll(async () => {
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Integration Admin",
        passwordHash: "not-used",
        role: "ADMIN"
      }
    });

    adminUserId = admin.id;
    sessionMock.getServerSession.mockResolvedValue({
      user: {
        id: admin.id,
        email: admin.email,
        role: "ADMIN"
      }
    });
  });

  afterAll(async () => {
    await prisma.project.deleteMany({
      where: { code: projectCode }
    });
    await prisma.user.deleteMany({
      where: { email: adminEmail }
    });
    await prisma.$disconnect();
  });

  it("creates a project through the real projects route", async () => {
    const response = await createProject(jsonRequest("/api/projects", {
      name: `Integration Project ${runId}`,
      code: projectCode,
      description: "Created by integration test"
    }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toMatchObject({
      name: `Integration Project ${runId}`,
      code: projectCode,
      description: "Created by integration test"
    });

    const project = await prisma.project.findUnique({ where: { code: projectCode } });
    expect(project).not.toBeNull();
  });

  it("creates and lists a suite through the real suites route", async () => {
    const response = await createSuite(
      jsonRequest(`/api/projects/${projectCode}/suites`, {
        title: `Integration Suite ${runId}`,
        description: "Created by integration test"
      }),
      routeParams(projectCode)
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toMatchObject({
      title: `Integration Suite ${runId}`,
      description: "Created by integration test"
    });

    suiteId = body.id;

    const listResponse = await listSuites(
      jsonRequest(`/api/projects/${projectCode}/suites`),
      routeParams(projectCode)
    );
    const suites = await listResponse.json();

    expect(listResponse.status).toBe(200);
    expect(suites).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: suiteId, title: `Integration Suite ${runId}` })
      ])
    );
  });

  it("creates and lists a test case with a step and tag through the real cases route", async () => {
    expect(suiteId).toBeTruthy();

    const response = await createCase(
      jsonRequest(`/api/projects/${projectCode}/cases`, {
        title: `Integration Case ${runId}`,
        suiteId,
        description: "Created by integration test",
        severity: "NORMAL",
        priority: "MEDIUM",
        automationStatus: "MANUAL",
        tags: [runId],
        steps: [
          {
            action: "Open the repository",
            expectedResult: "The case is visible",
            position: 0
          }
        ],
        customFields: {
          integrationRunId: runId
        }
      }),
      routeParams(projectCode)
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toMatchObject({
      title: `Integration Case ${runId}`,
      suiteId,
      steps: [
        expect.objectContaining({
          action: "Open the repository",
          expectedResult: "The case is visible",
          position: 0
        })
      ],
      tags: [
        expect.objectContaining({ name: runId })
      ]
    });

    const listResponse = await listCases(
      jsonRequest(`/api/projects/${projectCode}/cases`),
      routeParams(projectCode)
    );
    const cases = await listResponse.json();

    expect(listResponse.status).toBe(200);
    expect(cases).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: body.id,
          title: `Integration Case ${runId}`,
          suiteId
        })
      ])
    );

    const audit = await prisma.auditLog.findFirst({
      where: {
        userId: adminUserId,
        entity: "TEST_CASE",
        entityId: body.id
      }
    });
    expect(audit).not.toBeNull();
  });
});
