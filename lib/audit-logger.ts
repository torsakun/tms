import { prisma } from "@/lib/prisma";

export type AuditAction = "CREATED" | "UPDATED" | "DELETED" | "EXECUTED" | "SHARED";
export type AuditEntity = "PROJECT" | "TEST_CASE" | "TEST_SUITE" | "TEST_RUN" | "TEST_PLAN" | "INTEGRATION" | "ROLE" | "SHARED_STEP" | "ENVIRONMENT";

interface LogAuditParams {
  projectId: string;
  userId: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string;
  details?: string | Record<string, any>;
}

export async function logAudit({ projectId, userId, action, entity, entityId, details }: LogAuditParams) {
  try {
    const detailsString = details 
      ? (typeof details === "string" ? details : JSON.stringify(details))
      : null;

    await prisma.auditLog.create({
      data: {
        projectId,
        userId,
        action,
        entity,
        entityId,
        details: detailsString,
      }
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
    // We intentionally don't throw to prevent audit log failures from breaking core functionality
  }
}
