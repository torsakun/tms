import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDevRouteSecret } from "@/lib/dev-route-auth";
import { TestResultStatus, TestRunStatus } from "@prisma/client";

export async function GET(req: Request) {
  const authError = requireDevRouteSecret(req);
  if (authError) return authError;

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
            sequenceNumber: 1,
          },
          {
            title: `Handle invalid input errors gracefully in ${p.code}`,
            severity: "MAJOR",
            priority: "MEDIUM",
            automationStatus: "TO_BE_AUTOMATED",
            projectId: project.id,
            suiteId: suite.id,
            authorId: user.id,
            sequenceNumber: 2,
          },
          {
            title: `Check performance under load for ${p.name}`,
            severity: "NORMAL",
            priority: "LOW",
            automationStatus: "MANUAL",
            projectId: project.id,
            suiteId: suite.id,
            authorId: user.id,
            sequenceNumber: 3,
          },
          {
            title: `Security audit: SQL injection prevention in ${p.code}`,
            severity: "BLOCKER",
            priority: "HIGH",
            automationStatus: "AUTOMATED",
            projectId: project.id,
            suiteId: suite.id,
            authorId: user.id,
            sequenceNumber: 4,
          },
        ],
      });

      // Fetch created test cases
      const createdCases = await prisma.testCase.findMany({
        where: { projectId: project.id },
      });

      // Create a completed test run
      const completedRun = await prisma.testRun.create({
        data: {
          title: `Regression Run v1.0 - ${p.code}`,
          projectId: project.id,
          status: TestRunStatus.COMPLETED,
          authorId: user.id,
        },
      });

      // Create results for completed run
      const completedResults = createdCases.map((tc, index) => ({
        runId: completedRun.id,
        caseId: tc.id,
        status: index === 3 ? TestResultStatus.FAILED : TestResultStatus.PASSED,
        timeSpent: Math.floor(Math.random() * 5000) + 1000,
        comment: index === 3 ? "Failed due to SQL injection vulnerability detected during test scan" : "Passed successfully",
      }));
      await prisma.testRunResult.createMany({ data: completedResults });

      // Create an active test run
      const activeRun = await prisma.testRun.create({
        data: {
          title: `Active Test Run v1.1 - ${p.code}`,
          projectId: project.id,
          status: TestRunStatus.ACTIVE,
          authorId: user.id,
        },
      });

      // Create results for active run: 2 PASSED, 1 FAILED, 1 IN_PROGRESS
      const activeResults = createdCases.map((tc, index) => {
        let status = TestResultStatus.IN_PROGRESS;
        let comment = null;
        if (index === 0) {
          status = TestResultStatus.PASSED;
        } else if (index === 1) {
          status = TestResultStatus.FAILED;
          comment = "Input validator threw undefined error";
        } else if (index === 2) {
          status = TestResultStatus.PASSED;
        }
        return {
          runId: activeRun.id,
          caseId: tc.id,
          status,
          timeSpent: status === TestResultStatus.IN_PROGRESS ? null : Math.floor(Math.random() * 5000) + 1000,
          comment,
        };
      });
      await prisma.testRunResult.createMany({ data: activeResults });

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
