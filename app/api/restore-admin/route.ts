import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("key") !== "recover-my-data-999") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const passwordHash = await bcrypt.hash("password123", 10);

    await prisma.user.upsert({
      where: { email: "admin@example.com" },
      update: { passwordHash, name: "Admin User", role: "ADMIN" },
      create: {
        email: "admin@example.com",
        passwordHash,
        name: "Admin User",
        role: "ADMIN",
      },
    });

    await prisma.user.upsert({
      where: { email: "supat.tor@gmail.com" },
      update: { passwordHash, name: "Supat T", role: "ADMIN" },
      create: {
        email: "supat.tor@gmail.com",
        passwordHash,
        name: "Supat T",
        role: "ADMIN",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Admin users created/updated successfully!",
    });
  } catch (err: any) {
    console.error("Admin user creation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
