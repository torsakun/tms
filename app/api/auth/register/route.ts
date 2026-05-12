import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const isFirstUser = await prisma.user.count() === 0;

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: isFirstUser ? "ADMIN" : "USER", // First user gets ADMIN role
      },
    });

    return NextResponse.json({ success: true, user: { id: user.id, email: user.email, role: user.role } }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to register user" }, { status: 500 });
  }
}
