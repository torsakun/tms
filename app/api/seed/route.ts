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
      return NextResponse.json(
        { error: "Admin user not found, please run setup first" },
        { status: 400 },
      );
    }

    const projectsData = [
      {
        name: "E-Commerce Web",
        code: "ECO",
        desc: "Main B2C e-commerce platform testing",
      },
      {
        name: "Mobile Banking iOS",
        code: "MBI",
        desc: "Native iOS banking application",
      },
      {
        name: "Mobile Banking Android",
        code: "MBA",
        desc: "Native Android banking application",
      },
      {
        name: "Internal CRM",
        code: "CRM",
        desc: "Customer Relationship Management portal",
      },
      {
        name: "Payment Gateway API",
        code: "PAY",
        desc: "Core payment processing microservices",
      },
      {
        name: "HR Management System",
        code: "HRM",
        desc: "Employee onboarding and payroll",
      },
      {
        name: "Inventory Backend",
        code: "INV",
        desc: "Warehouse and stock management",
      },
      {
        name: "Analytics Dashboard",
        code: "ANA",
        desc: "Data visualization for executives",
      },
      {
        name: "Flight Booking Engine",
        code: "FLI",
        desc: "B2B flight ticketing system",
      },
      {
        name: "Customer Support Desk",
        code: "CSD",
        desc: "Ticketing and live chat system",
      },
    ];

    let createdCount = 0;

    for (const p of projectsData) {
      // Check if project already exists
      const existing = await prisma.project.findUnique({
        where: { code: p.code },
      });
      if (existing) continue;

      const project = await prisma.project.create({
        data: {
          name: p.name,
          code: p.code,
          description: p.desc,
        },
      });

      // Create a test suite for this project
      const suite = await prisma.testSuite.create({
        data: {
          title: "Core Functionality Suite",
          description: "Main end-to-end flows",
          projectId: project.id,
        },
      });

      // Add members
      await prisma.projectMember.create({
        data: {
          projectId: project.id,
          userId: user.id,
          role: "ADMIN",
        },
      });

      // Create test cases
      await prisma.testCase.createMany({
        data: [
          {
            title: `Verify happy path for ${p.name}`,
            severity: "CRITICAL",
            priority: "HIGH",
            automationStatus: "AUTOMATED",
            projectId: project.id,
            suiteId: suite.id,
            authorId: user.id,
          },
          {
            title: `Handle invalid input errors gracefully in ${p.code}`,
            severity: "MAJOR",
            priority: "MEDIUM",
            automationStatus: "TO_BE_AUTOMATED",
            projectId: project.id,
            suiteId: suite.id,
            authorId: user.id,
          },
          {
            title: `Check performance under load for ${p.name}`,
            severity: "NORMAL",
            priority: "LOW",
            automationStatus: "MANUAL",
            projectId: project.id,
            suiteId: suite.id,
            authorId: user.id,
          },
          {
            title: `Security audit: SQL injection prevention in ${p.code}`,
            severity: "BLOCKER",
            priority: "HIGH",
            automationStatus: "AUTOMATED",
            projectId: project.id,
            suiteId: suite.id,
            authorId: user.id,
          },
        ],
      });

      // Create a test run
      await prisma.testRun.create({
        data: {
          title: `Regression Run v1.0 - ${p.code}`,
          projectId: project.id,
          status: "ACTIVE",
        },
      });

      createdCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${createdCount} new projects with suites and test cases!`,
      totalProjectsSeeded: createdCount,
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Failed to seed data" }, { status: 500 });
  }
}
