import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authHeader = req.headers.get("authorization");
    const secret =
      process.env.CRON_SECRET ||
      process.env.NEXTAUTH_SECRET ||
      "super-secret-dev-key";

    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const current = await prisma.deploymentLog.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const newLogs = body.logs
      ? `${current.logs || ""}\n${body.logs}`
      : current.logs;

    await prisma.deploymentLog.update({
      where: { id },
      data: {
        status: body.status || current.status,
        logs: newLogs,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
