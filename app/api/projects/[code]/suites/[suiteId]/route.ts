import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { requireProjectRole } from "@/lib/project-auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ code: string; suiteId: string }> },
) {
  const { code: projectIdOrCode, suiteId } = await params;
  try {
    const project = await prisma.project.findFirst({
      where: {
        OR: [{ id: projectIdOrCode }, { code: projectIdOrCode }],
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasAccess = await requireProjectRole(
      project.code,
      (session.user as any).id,
      ["EDITOR", "ADMIN"],
    );
    if (!hasAccess && (session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        {
          error:
            "Forbidden: You do not have permission to edit suites in this project",
        },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { title, description } = body;

    const suite = await prisma.testSuite.update({
      where: { id: suiteId },
      data: { title, description },
    });

    return NextResponse.json(suite);
  } catch (error) {
    console.error("Failed to update suite", error);
    return NextResponse.json(
      { error: "Failed to update suite" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ code: string; suiteId: string }> },
) {
  const { code: projectIdOrCode, suiteId } = await params;
  try {
    const project = await prisma.project.findFirst({
      where: {
        OR: [{ id: projectIdOrCode }, { code: projectIdOrCode }],
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasAccess = await requireProjectRole(
      project.code,
      (session.user as any).id,
      ["EDITOR", "ADMIN"],
    );
    if (!hasAccess && (session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        {
          error:
            "Forbidden: You do not have permission to delete suites in this project",
        },
        { status: 403 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const retainCases = body.retainCases === true;

    // Fetch the suite to be deleted to know its parent
    const suiteToDelete = await prisma.testSuite.findUnique({
      where: { id: suiteId },
      select: { id: true, parentId: true },
    });

    if (!suiteToDelete) {
      return NextResponse.json({ error: "Suite not found" }, { status: 404 });
    }

    // Function to recursively get all descendant suite IDs
    async function getDescendantIds(parentId: string): Promise<string[]> {
      const children = await prisma.testSuite.findMany({
        where: { parentId },
        select: { id: true },
      });
      let ids = children.map((c) => c.id);
      for (const child of children) {
        const desc = await getDescendantIds(child.id);
        ids = ids.concat(desc);
      }
      return ids;
    }

    const allSuiteIds = [suiteId, ...(await getDescendantIds(suiteId))];

    if (retainCases) {
      // Move all cases in these suites to the parent suite (or unassigned if null)
      await prisma.testCase.updateMany({
        where: { suiteId: { in: allSuiteIds } },
        data: { suiteId: suiteToDelete.parentId },
      });
    } else {
      // Delete all cases in these suites
      await prisma.testCase.deleteMany({
        where: { suiteId: { in: allSuiteIds } },
      });
    }

    // Finally delete the suite itself (Prisma Cascade will delete the child suites folders)
    await prisma.testSuite.delete({
      where: { id: suiteId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete suite", error);
    return NextResponse.json(
      { error: "Failed to delete suite" },
      { status: 400 },
    );
  }
}
