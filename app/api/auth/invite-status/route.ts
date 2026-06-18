import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      select: {
        status: true,
        expiresAt: true,
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid invitation token" },
        { status: 404 },
      );
    }

    if (invitation.status !== "PENDING") {
      return NextResponse.json(
        {
          error:
            "This invitation has already been accepted or is no longer valid.",
        },
        { status: 400 },
      );
    }

    if (new Date() > invitation.expiresAt) {
      return NextResponse.json(
        { error: "This invitation has expired." },
        { status: 400 },
      );
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error("Failed to check invitation status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
