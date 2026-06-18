import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

// Validate a reset token (used by the reset page on load)
export async function GET(req: Request) {
  try {
    const token = new URL(req.url).searchParams.get("token");
    if (!token)
      return NextResponse.json({ error: "Missing token" }, { status: 400 });

    const rec = await prisma.passwordResetToken.findUnique({
      where: { token },
    });
    if (!rec)
      return NextResponse.json(
        { error: "Invalid or unknown reset link." },
        { status: 404 },
      );
    if (rec.usedAt)
      return NextResponse.json(
        { error: "This reset link has already been used." },
        { status: 400 },
      );
    if (new Date() > rec.expiresAt)
      return NextResponse.json(
        { error: "This reset link has expired." },
        { status: 400 },
      );

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error("Validate reset token failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Consume a reset token and set a new password
export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();
    if (!token || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 },
      );
    }

    const rec = await prisma.passwordResetToken.findUnique({
      where: { token },
    });
    if (!rec)
      return NextResponse.json(
        { error: "Invalid or unknown reset link." },
        { status: 404 },
      );
    if (rec.usedAt)
      return NextResponse.json(
        { error: "This reset link has already been used." },
        { status: 400 },
      );
    if (new Date() > rec.expiresAt)
      return NextResponse.json(
        { error: "This reset link has expired." },
        { status: 400 },
      );

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.$transaction([
      prisma.user.update({ where: { id: rec.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({
        where: { id: rec.id },
        data: { usedAt: new Date() },
      }),
      // Invalidate any other outstanding tokens for this user
      prisma.passwordResetToken.updateMany({
        where: { userId: rec.userId, usedAt: null, id: { not: rec.id } },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset password failed:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 },
    );
  }
}
