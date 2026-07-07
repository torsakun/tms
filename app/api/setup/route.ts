import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import {
  getDevAdminCredentials,
  requireDevRouteSecret,
} from "@/lib/dev-route-auth";

export async function GET(req: Request) {
  const authError = requireDevRouteSecret(req);
  if (authError) return authError;

  const credentials = getDevAdminCredentials();
  if (!credentials) {
    return NextResponse.json(
      { error: "DEV_ADMIN_EMAIL and DEV_ADMIN_PASSWORD are required" },
      { status: 503 },
    );
  }

  try {
    const passwordHash = await bcrypt.hash(credentials.password, 10);

    const user = await prisma.user.upsert({
      where: { email: credentials.email },
      update: {
        passwordHash,
        name: "Admin User",
        role: "ADMIN",
      },
      create: {
        email: credentials.email,
        passwordHash,
        name: "Admin User",
        role: "ADMIN",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Demo user created/updated successfully!",
      user: {
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json(
      { error: "Failed to create demo user" },
      { status: 500 },
    );
  }
}
