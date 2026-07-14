import { beforeEach, describe, expect, it, vi } from "vitest";

const tagMock = vi.hoisted(() => ({ create: vi.fn(), findMany: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { tag: tagMock } }));

const projectAuthMock = vi.hoisted(() => ({
  requireProjectAccess: vi.fn(),
}));
vi.mock("@/lib/project-route-auth", () => projectAuthMock);

import { POST, GET } from "@/app/api/projects/[code]/tags/route";

const routeParams = (code: string) => ({ params: Promise.resolve({ code }) });

const makeRequest = (body: unknown) =>
  new Request("http://localhost/api/projects/TEST/tags", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

describe("POST /api/projects/[code]/tags", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    projectAuthMock.requireProjectAccess.mockResolvedValue({ userId: "u1", userRole: "ADMIN" });
  });

  it("returns 400 when name is missing", async () => {
    const req = makeRequest({});
    const res = await POST(req, routeParams("TEST"));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it("returns 201 and the created tag on success", async () => {
    const createdTag = { id: "tag-1", name: "bug", projectId: "TEST" };
    tagMock.create.mockResolvedValueOnce(createdTag);

    const req = makeRequest({ name: "bug" });
    const res = await POST(req, routeParams("TEST"));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json).toEqual(createdTag);
    expect(tagMock.create).toHaveBeenCalledWith({
      data: { name: "bug", projectId: "TEST" },
    });
  });

  it("returns 409 when prisma throws a P2002 unique constraint error", async () => {
    const uniqueError = Object.assign(new Error("Unique constraint failed"), { code: "P2002" });
    tagMock.create.mockRejectedValueOnce(uniqueError);

    const req = makeRequest({ name: "bug" });
    const res = await POST(req, routeParams("TEST"));
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toBe("Tag already exists in this project");
  });

  it("returns 400 when prisma throws a non-P2002 error", async () => {
    tagMock.create.mockRejectedValueOnce(new Error("Some other DB error"));

    const req = makeRequest({ name: "bug" });
    const res = await POST(req, routeParams("TEST"));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid request data");
  });
});

describe("GET /api/projects/[code]/tags", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the array of tags for the project", async () => {
    const tags = [
      { id: "tag-1", name: "bug", projectId: "TEST" },
      { id: "tag-2", name: "feature", projectId: "TEST" },
    ];
    tagMock.findMany.mockResolvedValueOnce(tags);

    const req = new Request("http://localhost/api/projects/TEST/tags");
    const res = await GET(req, routeParams("TEST"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(tags);
    expect(tagMock.findMany).toHaveBeenCalledWith({
      where: { projectId: "TEST" },
      orderBy: { name: "asc" },
    });
  });
});
