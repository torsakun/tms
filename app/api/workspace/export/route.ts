import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (currentUser?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 },
      );
    }

    // Fetch all relevant data for the backup
    const projects = await prisma.project.findMany({
      include: {
        suites: true,
        testCases: {
          include: {
            steps: true,
          },
        },
        testPlans: true,
        testRuns: {
          include: {
            results: true,
          },
        },
        tags: true,
        customFields: true,
        environments: true,
        milestones: true,
        sharedSteps: {
          include: {
            testSteps: true,
          },
        },
      },
    });

    const workspaceRoles = await prisma.workspaceRole.findMany();
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        workspaceRoleId: true,
        createdAt: true,
        updatedAt: true,
        // Exclude passwordHash for security reasons, even in backups.
      },
    });

    const backupData = {
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      data: {
        projects,
        workspaceRoles,
        users,
      },
    };

    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `qmaster-backup-${dateStr}.json`;

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("Backup Export Error:", error);
    return NextResponse.json(
      { error: "Internal server error during backup generation" },
      { status: 500 },
    );
  }
}
