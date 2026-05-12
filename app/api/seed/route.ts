import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");

  if (secret !== "socket9") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!user) {
      return NextResponse.json({ error: "Admin user not found, please run setup first" }, { status: 400 });
    }

    // Create a demo project
    const project = await prisma.project.create({
      data: {
        name: "E-Commerce Platform",
        code: "EC",
        description: "Main e-commerce website testing",
        testCases: {
          create: [
            {
              title: "User can add item to cart",
              status: "ACTIVE",
              priority: "HIGH",
              severity: "MAJOR",
              behavior: "POSITIVE",
              automation: "AUTOMATED",
              authorId: user.id
            },
            {
              title: "Checkout process works with credit card",
              status: "ACTIVE",
              priority: "CRITICAL",
              severity: "CRITICAL",
              behavior: "POSITIVE",
              automation: "TO_BE_AUTOMATED",
              authorId: user.id
            },
            {
              title: "Search returns relevant results",
              status: "ACTIVE",
              priority: "MEDIUM",
              severity: "NORMAL",
              behavior: "POSITIVE",
              automation: "MANUAL",
              authorId: user.id
            }
          ]
        }
      }
    });

    // Create a demo test run
    const testRun = await prisma.testRun.create({
      data: {
        title: "Release 1.0 Regression",
        projectId: project.id,
        status: "ACTIVE",
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Mock data seeded successfully! You now have a project and test cases."
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Failed to seed data" }, { status: 500 });
  }
}
