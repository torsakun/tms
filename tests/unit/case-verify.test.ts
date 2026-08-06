import { beforeEach, describe, expect, it, vi } from "vitest";

const testCaseMock = vi.hoisted(() => ({ update: vi.fn() }));
const execMock = vi.hoisted(() => vi.fn());
const fsMock = vi.hoisted(() => ({
  writeFileSync: vi.fn(),
  unlinkSync: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: { testCase: testCaseMock } }));
vi.mock("child_process", () => ({ exec: vi.fn() }));
vi.mock("util", () => ({
  default: { promisify: () => execMock },
  promisify: () => execMock,
}));
vi.mock("fs", () => ({ default: fsMock, ...fsMock }));

import { POST } from "@/app/api/projects/[code]/cases/[caseId]/verify/route";

const routeParams = (code: string, caseId: string) => ({
  params: Promise.resolve({ code, caseId }),
});

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/projects/FIN/cases/case-001/verify", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/projects/[code]/cases/[caseId]/verify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testCaseMock.update.mockResolvedValue({});
  });

  it("returns 400 when no script is provided", async () => {
    const res = await POST(jsonRequest({}), routeParams("FIN", "case-001"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/Script is required/);
    expect(execMock).not.toHaveBeenCalled();
  });

  it("returns passed=true and saves log when playwright succeeds", async () => {
    execMock.mockResolvedValue({ stdout: "1 passed", stderr: "" });

    const res = await POST(
      jsonRequest({ script: "await page.goto('/')" }),
      routeParams("FIN", "case-001")
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.passed).toBe(true);
    expect(testCaseMock.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ lastVerificationLog: expect.any(String) }) })
    );
  });

  it("returns passed=false when playwright exits with error", async () => {
    execMock.mockRejectedValue({ stdout: "0 passed\n1 failed", stderr: "Error", message: "exit 1" });

    const res = await POST(
      jsonRequest({ script: "await page.goto('/')" }),
      routeParams("FIN", "case-001")
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.passed).toBe(false);
  });

  it("wraps bare script in a playwright test block", async () => {
    execMock.mockResolvedValue({ stdout: "1 passed", stderr: "" });

    await POST(
      jsonRequest({ script: "await page.goto('/')" }),
      routeParams("FIN", "case-001")
    );

    const writtenContent = fsMock.writeFileSync.mock.calls[0][1] as string;
    expect(writtenContent).toContain("test('Automated Test Case'");
  });

  it("does not double-wrap scripts that already contain test(", async () => {
    execMock.mockResolvedValue({ stdout: "1 passed", stderr: "" });
    const alreadyWrapped = `import { test, expect } from '@playwright/test';\ntest('my test', async ({ page }) => { await page.goto('/'); });`;

    await POST(jsonRequest({ script: alreadyWrapped }), routeParams("FIN", "case-001"));

    const writtenContent = fsMock.writeFileSync.mock.calls[0][1] as string;
    const testCount = (writtenContent.match(/test\(/g) || []).length;
    expect(testCount).toBeGreaterThan(0);
    expect(writtenContent).not.toContain("test('Automated Test Case'");
  });
});
