import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function GET(req: Request) {
  // Simple protection: only allow setup if there are no users, or passing a special secret
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");

  if (secret !== "socket9") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const email = 'admin@example.com';
    const password = 'password123';
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
      where: { email },
      update: { 
        passwordHash, 
        name: 'Admin User', 
        role: 'ADMIN' 
      },
      create: {
        email,
        passwordHash,
        name: 'Admin User',
        role: 'ADMIN'
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Demo user created/updated successfully!",
      user: {
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json({ error: "Failed to create demo user" }, { status: 500 });
  }
}
