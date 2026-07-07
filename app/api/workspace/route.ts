import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorized, forbidden } from "@/lib/api-auth";
import { canManageWorkspace } from "@/lib/permissions";

const DEFAULT_WORKSPACE_NAME = "QMaster Workspace";

// Destructively delete the workspace's content: removes every Project (which
// cascades to its suites/cases/runs/results/etc). Users and roles are preserved.
// Gated by: an authenticated session, the `ws-update`/`workspace-manage`
// permission, and a type-to-confirm name match re-validated on the server.
export async function DELETE(req: NextRequest) {
  const actor = await getSessionUser();
  if (!actor) return unauthorized();
  if (!canManageWorkspace(actor)) return forbidden();

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const confirm = typeof body?.confirm === "string" ? body.confirm.trim() : "";

  // Re-validate the typed name against the stored workspace name (default fallback).
  const nameSetting = await prisma.workspaceSetting.findUnique({
    where: { key: "WORKSPACE_NAME" },
  });
  const workspaceName = (nameSetting?.value || DEFAULT_WORKSPACE_NAME).trim();

  if (!confirm || confirm !== workspaceName) {
    return NextResponse.json(
      { error: "Confirmation name does not match the workspace name." },
      { status: 400 },
    );
  }

  try {
    // Deleting projects cascades to all child records via the schema relations.
    const result = await prisma.$transaction(async (tx) => {
      const { count } = await tx.project.deleteMany({});
      return count;
    });

    return NextResponse.json({ success: true, deletedProjects: result });
  } catch (error) {
    console.error("Failed to delete workspace:", error);
    return NextResponse.json(
      { error: "Failed to delete workspace" },
      { status: 500 },
    );
  }
}
