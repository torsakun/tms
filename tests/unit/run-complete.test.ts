import { beforeEach, describe, expect, it, vi } from "vitest";

const testRunMock = vi.hoisted(() => ({ findUnique: vi.fn(), update: vi.fn() }));
const fetchMock = vi.hoisted(() => vi.fn());
const authMock = vi.hoisted(() => ({ requireRunAccess: vi.fn() }));

vi.mock("@/lib/prisma", () => ({ prisma: { testRun: testRunMock } }));
vi.mock("@/lib/project-route-auth", () => authMock);
vi.stubGlobal("fetch", fetchMock);

import { POST } from "@/app/api/runs/[runId]/complete/route";

const routeParams = (runId: string) => ({ params: Promise.resolve({ runId }) });

const fakeRun = {
  id: "run-1",
  title: "Regression Suite",
  status: "IN_PROGRESS",
  results: [
    { id: "r1", status: "PASSED" },
    { id: "r2", status: "PASSED" },
    { id: "r3", status: "FAILED" },
  ],
  project: {
    code: "PROJ",
    name: "My Project",
    msTeamsWebhookUrl: "https://teams.example.com/webhook",
  },
};

const updatedRun = { ...fakeRun, status: "COMPLETED" };

describe("POST /api/runs/[runId]/complete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock.mockResolvedValue({ ok: true });
    authMock.requireRunAccess.mockResolvedValue({ userId: "u1", userRole: "ADMIN" });
  });

  it("returns 404 when run is not found", async () => {
    testRunMock.findUnique.mockResolvedValue(null);

    const req = new Request("http://localhost/api/runs/run-999/complete", { method: "POST" });
    const res = await POST(req, routeParams("run-999"));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body).toEqual({ error: "Run not found" });
  });

  it("returns 200 with success and does not call fetch when msTeamsWebhookUrl is null", async () => {
    const runNoWebhook = {
      ...fakeRun,
      project: { ...fakeRun.project, msTeamsWebhookUrl: null },
    };
    testRunMock.findUnique.mockResolvedValue(runNoWebhook);
    testRunMock.update.mockResolvedValue({ ...runNoWebhook, status: "COMPLETED" });

    const req = new Request("http://localhost/api/runs/run-1/complete", { method: "POST" });
    const res = await POST(req, routeParams("run-1"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.run.status).toBe("COMPLETED");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("calls fetch with the Teams webhook URL when msTeamsWebhookUrl is set", async () => {
    testRunMock.findUnique.mockResolvedValue(fakeRun);
    testRunMock.update.mockResolvedValue(updatedRun);

    const req = new Request("http://localhost/api/runs/run-1/complete", { method: "POST" });
    const res = await POST(req, routeParams("run-1"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toBe("https://teams.example.com/webhook");
  });

  it("sets themeColor to E81123 (red) when there are failed results", async () => {
    testRunMock.findUnique.mockResolvedValue(fakeRun); // has 1 FAILED result
    testRunMock.update.mockResolvedValue(updatedRun);

    const req = new Request("http://localhost/api/runs/run-1/complete", { method: "POST" });
    await POST(req, routeParams("run-1"));

    const fetchBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(fetchBody.themeColor).toBe("E81123");
  });

  it("sets themeColor to 00CC6A (green) when all results passed", async () => {
    const allPassedRun = {
      ...fakeRun,
      results: [
        { id: "r1", status: "PASSED" },
        { id: "r2", status: "PASSED" },
      ],
    };
    testRunMock.findUnique.mockResolvedValue(allPassedRun);
    testRunMock.update.mockResolvedValue({ ...allPassedRun, status: "COMPLETED" });

    const req = new Request("http://localhost/api/runs/run-1/complete", { method: "POST" });
    await POST(req, routeParams("run-1"));

    const fetchBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(fetchBody.themeColor).toBe("00CC6A");
  });

  it("returns 200 and swallows error when Teams webhook fetch throws", async () => {
    testRunMock.findUnique.mockResolvedValue(fakeRun);
    testRunMock.update.mockResolvedValue(updatedRun);
    fetchMock.mockRejectedValue(new Error("Network failure"));

    const req = new Request("http://localhost/api/runs/run-1/complete", { method: "POST" });
    const res = await POST(req, routeParams("run-1"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.run).toBeDefined();
  });

  it("returns 500 when the database throws an error", async () => {
    testRunMock.findUnique.mockRejectedValue(new Error("DB connection failed"));

    const req = new Request("http://localhost/api/runs/run-1/complete", { method: "POST" });
    const res = await POST(req, routeParams("run-1"));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("DB connection failed");
  });
});
