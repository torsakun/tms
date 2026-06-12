import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

// Registration status: open only when there are no users yet (first-admin bootstrap).
// After that the workspace is invite-only.
export async function GET() {
  try {
    const userCount = await prisma.user.count();
    return NextResponse.json({ open: userCount === 0 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ open: false });
  }
}

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Invite-only: self-registration is allowed ONLY to bootstrap the very first
    // (admin) user. Once any user exists, new accounts must be created via invite.
    const isFirstUser = (await prisma.user.count()) === 0;
    if (!isFirstUser) {
      return NextResponse.json(
        { error: "Registration is invite-only. Please ask an administrator to send you an invite." },
        { status: 403 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "ADMIN", // First user bootstraps as ADMIN
      },
    });

    return NextResponse.json({ success: true, user: { id: user.id, email: user.email, role: user.role } }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to register user" }, { status: 500 });
  }
}
