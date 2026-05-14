import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get('key') !== 'recover-my-data-999') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Get or create a default user
    let user = await prisma.user.findFirst({
      where: { email: "supat.tor@gmail.com" }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: "supat.tor@gmail.com",
          name: "Supat T",
          passwordHash: "hashedpassword123", // mock
        }
      });
    }

    const projectNames = [
      "E-Commerce Mobile App",
      "Finance Dashboard V2",
      "CRM Integration Service",
      "Healthcare Patient Portal",
      "Logistics Tracking System",
      "HR Management Software",
      "AI Marketing Tool",
      "Inventory Management API",
      "Social Media Analytics",
      "Customer Support Chatbot"
    ];

    const severities = ["BLOCKER", "CRITICAL", "MAJOR", "NORMAL", "MINOR", "TRIVIAL"];
    const priorities = ["HIGH", "MEDIUM", "LOW"];
    const autoStatuses = ["AUTOMATED", "TO_BE_AUTOMATED", "MANUAL"];

    for (let i = 0; i < projectNames.length; i++) {
      const projName = projectNames[i];
      const code = projName.split(" ").map(w => w[0]).join("").toUpperCase().substring(0, 10) + (i + 1);

      // Check if project exists
      const existingProject = await prisma.project.findFirst({ where: { code } });
      if (existingProject) continue;

      // Create Project
      const project = await prisma.project.create({
        data: {
          name: projName,
          code: code,
          description: `This is an auto-generated project for ${projName}`,
        }
      });

      // Create Suites
      const suites = [];
      const suiteCount = 8;
      for (let s = 1; s <= suiteCount; s++) {
        const suite = await prisma.testSuite.create({
          data: {
            title: `Feature Module ${s}`,
            description: `Test cases for feature module ${s}`,
            projectId: project.id,
          }
        });
        suites.push(suite);
      }

      // Create ~100 Test Cases
      const caseCount = 100 + Math.floor(Math.random() * 50); // 100 to 150 cases
      const testCaseData = [];
      for (let c = 1; c <= caseCount; c++) {
        const suite = suites[Math.floor(Math.random() * suites.length)];
        testCaseData.push({
          title: `Verify functionality ${c} in ${suite.title}`,
          description: `Auto-generated test case description for case ${c}`,
          projectId: project.id,
          suiteId: suite.id,
          authorId: user.id,
          severity: severities[Math.floor(Math.random() * severities.length)] as any,
          priority: priorities[Math.floor(Math.random() * priorities.length)] as any,
          automationStatus: autoStatuses[Math.floor(Math.random() * autoStatuses.length)] as any,
        });
      }

      await prisma.testCase.createMany({ data: testCaseData });
      const createdCases = await prisma.testCase.findMany({ where: { projectId: project.id } });

      // Create 3 Test Runs for the project
      for (let r = 1; r <= 3; r++) {
        const run = await prisma.testRun.create({
          data: {
            title: `Regression Test Run v1.${r}`,
            description: `Execution run for milestone ${r}`,
            projectId: project.id,
            status: r === 3 ? "ACTIVE" : "COMPLETED",
          }
        });

        // Create Results for some cases
        const runResultsData = [];
        const casesToRun = createdCases.slice(0, 40 + Math.floor(Math.random() * 40)); 
        
        for (const tc of casesToRun) {
          const rand = Math.random();
          let status = "PASSED";
          if (rand > 0.8) status = "FAILED";
          else if (rand > 0.75) status = "BLOCKED";
          else if (rand > 0.7) status = "SKIPPED";

          runResultsData.push({
            runId: run.id,
            caseId: tc.id,
            status: status as any,
            timeSpent: Math.floor(Math.random() * 5000) + 1000,
          });
        }

        await prisma.testRunResult.createMany({ data: runResultsData });
      }
    }

    return NextResponse.json({ success: true, message: "Generated 10 projects and hundreds of test cases successfully!" });
  } catch (err: any) {
    console.error("Seed error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
