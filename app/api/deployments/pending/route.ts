import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const secret =
      process.env.CRON_SECRET ||
      process.env.NEXTAUTH_SECRET ||
      "super-secret-dev-key";

    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pending = await prisma.deploymentLog.findFirst({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
    });

    if (!pending) {
      return NextResponse.json({ id: null });
    }

    return NextResponse.json({ id: pending.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
