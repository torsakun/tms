import { beforeEach, describe, expect, it, vi } from "vitest";

const projectMock = vi.hoisted(() => ({ findUnique: vi.fn() }));
const pipelineScheduleMock = vi.hoisted(() => ({
  findFirst: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));
const fetchMock = vi.hoisted(() => vi.fn());
const requireProjectAccessMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  prisma: { project: projectMock, pipelineSchedule: pipelineScheduleMock },
}));
vi.mock("@/lib/project-route-auth", () => ({
  requireProjectAccess: requireProjectAccessMock,
}));
vi.stubGlobal("fetch", fetchMock);

import { PATCH, DELETE } from "@/app/api/projects/[code]/pipelines/[id]/route";

const routeParams = (code: string, id: string) => ({
  params: Promise.resolve({ code, id }),
});

const projectNoGitHub = {
  id: "p1",
  code: "FIN",
  githubOwner: null,
  githubRepo: null,
  githubToken: null,
};

const projectWithGitHub = {
  id: "p1",
  code: "FIN",
  githubOwner: "acme",
  githubRepo: "tests",
  githubToken: "gh-token",
};

const existingPipeline = {
  id: "pipe-1",
  title: "Nightly Run",
  isActive: false,
  cron: "0 0 * * *",
};

const patchBody = { isActive: true, cron: "0 * * * *" };

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/projects/FIN/pipelines/pipe-1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  requireProjectAccessMock.mockResolvedValue({ userId: "u1", userRole: "ADMIN" });
});

describe("PATCH /api/projects/[code]/pipelines/[id]", () => {
  it("returns 404 when project is not found", async () => {
    projectMock.findUnique.mockResolvedValue(null);

    const res = await PATCH(makeRequest(patchBody), routeParams("FIN", "pipe-1"));
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error).toBe("Project not found");
    expect(pipelineScheduleMock.findFirst).not.toHaveBeenCalled();
  });

  it("returns 404 when pipeline is not found", async () => {
    projectMock.findUnique.mockResolvedValue(projectNoGitHub);
    pipelineScheduleMock.findFirst.mockResolvedValue(null);

    const res = await PATCH(makeRequest(patchBody), routeParams("FIN", "pipe-1"));
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error).toBe("Pipeline not found");
    expect(pipelineScheduleMock.update).not.toHaveBeenCalled();
  });

  it("returns 200 and updates pipeline without GitHub sync when project has no credentials", async () => {
    const updatedPipeline = { ...existingPipeline, isActive: true, cron: "0 * * * *" };
    projectMock.findUnique.mockResolvedValue(projectNoGitHub);
    pipelineScheduleMock.findFirst.mockResolvedValue(existingPipeline);
    pipelineScheduleMock.update.mockResolvedValue(updatedPipeline);

    const res = await PATCH(makeRequest(patchBody), routeParams("FIN", "pipe-1"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.isActive).toBe(true);
    expect(json.cron).toBe("0 * * * *");
    expect(pipelineScheduleMock.update).toHaveBeenCalledWith({
      where: { id: "pipe-1" },
      data: { isActive: true, cron: "0 * * * *" },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 200 and calls fetch for GitHub sync when project has credentials", async () => {
    const updatedPipeline = { ...existingPipeline, isActive: true, cron: "0 * * * *" };
    projectMock.findUnique.mockResolvedValue(projectWithGitHub);
    pipelineScheduleMock.findFirst.mockResolvedValue(existingPipeline);
    pipelineScheduleMock.update.mockResolvedValue(updatedPipeline);

    // First fetch: GET to retrieve SHA
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sha: "abc123" }),
    });
    // Second fetch: PUT to create/update file
    fetchMock.mockResolvedValueOnce({ ok: true });

    const res = await PATCH(makeRequest(patchBody), routeParams("FIN", "pipe-1"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.isActive).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [getUrl, getOptions] = fetchMock.mock.calls[0];
    expect(getUrl).toContain("tessa-cron-pipe-1.yml");
    expect(getOptions.headers["Authorization"]).toBe("token gh-token");

    const [putUrl, putOptions] = fetchMock.mock.calls[1];
    expect(putUrl).toContain("tessa-cron-pipe-1.yml");
    expect(putOptions.method).toBe("PUT");
    const putBody = JSON.parse(putOptions.body);
    expect(putBody.sha).toBe("abc123");
  });
});

describe("DELETE /api/projects/[code]/pipelines/[id]", () => {
  it("returns 200 and deletes pipeline without GitHub cleanup when project has no credentials", async () => {
    projectMock.findUnique.mockResolvedValue(projectNoGitHub);
    pipelineScheduleMock.findFirst.mockResolvedValue(existingPipeline);
    pipelineScheduleMock.delete.mockResolvedValue(existingPipeline);

    const req = new Request("http://localhost/api/projects/FIN/pipelines/pipe-1", {
      method: "DELETE",
    });
    const res = await DELETE(req, routeParams("FIN", "pipe-1"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ success: true });
    expect(pipelineScheduleMock.delete).toHaveBeenCalledWith({ where: { id: "pipe-1" } });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 200 and calls fetch to delete GitHub file when project has credentials", async () => {
    projectMock.findUnique.mockResolvedValue(projectWithGitHub);
    pipelineScheduleMock.findFirst.mockResolvedValue(existingPipeline);
    pipelineScheduleMock.delete.mockResolvedValue(existingPipeline);

    // First fetch: GET to retrieve SHA
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sha: "def456" }),
    });
    // Second fetch: DELETE the file
    fetchMock.mockResolvedValueOnce({ ok: true });

    const req = new Request("http://localhost/api/projects/FIN/pipelines/pipe-1", {
      method: "DELETE",
    });
    const res = await DELETE(req, routeParams("FIN", "pipe-1"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ success: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [getUrl, getOptions] = fetchMock.mock.calls[0];
    expect(getUrl).toContain("tessa-cron-pipe-1.yml");
    expect(getOptions.headers["Authorization"]).toBe("token gh-token");

    const [deleteUrl, deleteOptions] = fetchMock.mock.calls[1];
    expect(deleteUrl).toContain("tessa-cron-pipe-1.yml");
    expect(deleteOptions.method).toBe("DELETE");
    const deleteBody = JSON.parse(deleteOptions.body);
    expect(deleteBody.sha).toBe("def456");
  });
});
