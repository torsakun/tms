import { beforeEach, describe, expect, it, vi } from "vitest";

const auditLogMock = vi.hoisted(() => ({ create: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: { auditLog: auditLogMock },
}));

import { logAudit } from "@/lib/audit-logger";

describe("logAudit", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates audit log with string details", async () => {
    auditLogMock.create.mockResolvedValue({});

    await logAudit({
      projectId: "proj-fin",
      userId: "user-001",
      action: "CREATED",
      entity: "TEST_CASE",
      entityId: "case-001",
      details: "Created Test Case: Login flow",
    });

    expect(auditLogMock.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        projectId: "proj-fin",
        userId: "user-001",
        action: "CREATED",
        entity: "TEST_CASE",
        entityId: "case-001",
        details: "Created Test Case: Login flow",
      }),
    });
  });

  it("serializes object details to JSON string", async () => {
    auditLogMock.create.mockResolvedValue({});

    await logAudit({
      projectId: "proj-fin",
      userId: "user-001",
      action: "UPDATED",
      entity: "TEST_RUN",
      details: { field: "status", from: "ACTIVE", to: "COMPLETED" },
    });

    expect(auditLogMock.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        details: JSON.stringify({ field: "status", from: "ACTIVE", to: "COMPLETED" }),
      }),
    });
  });

  it("stores null when details is not provided", async () => {
    auditLogMock.create.mockResolvedValue({});

    await logAudit({
      projectId: "proj-fin",
      userId: "user-001",
      action: "DELETED",
      entity: "TEST_CASE",
    });

    expect(auditLogMock.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ details: null }),
    });
  });

  it("does not throw when DB write fails", async () => {
    auditLogMock.create.mockRejectedValue(new Error("DB connection lost"));

    await expect(
      logAudit({ projectId: "p", userId: "u", action: "CREATED", entity: "PROJECT" })
    ).resolves.not.toThrow();
  });
});
