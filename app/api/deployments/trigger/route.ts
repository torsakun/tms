import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { triggerType = "Manual (Admin UI)", commitHash, commitMessage } = await req.json().catch(() => ({}));

    // Check if there's already a pending or building deployment to avoid spam
    const active = await prisma.deploymentLog.findFirst({
      where: { status: { in: ["PENDING", "BUILDING"] } }
    });

    if (active) {
      return NextResponse.json({ error: "A deployment is already active or pending", id: active.id }, { status: 400 });
    }

    const log = await prisma.deploymentLog.create({
      data: {
        status: "PENDING",
        trigger: triggerType,
        commitHash,
        commitMessage,
        logs: "Deployment queued and waiting for daemon..."
      }
    });

    return NextResponse.json({ success: true, id: log.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
