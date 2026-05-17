import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CronExpressionParser } from "cron-parser";

export async function POST(req: Request) {
  try {
    // 1. Verify Authorization
    const authHeader = req.headers.get("authorization");
    const secret = process.env.CRON_SECRET || process.env.NEXTAUTH_SECRET || "super-secret-dev-key";
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[CRON] Processing scheduled pipelines...");

    // 2. Fetch all active schedules
    const schedules = await prisma.pipelineSchedule.findMany({
      where: { isActive: true },
      include: { project: true }
    });

    const now = new Date();
    const triggeredRunIds: string[] = [];

    // 3. Evaluate each schedule
    for (const schedule of schedules) {
      try {
        const interval = CronExpressionParser.parse(schedule.cron);
        const prev = interval.prev().toDate();
        
        // If the previous scheduled time is within the last 60 seconds, trigger it
        const diffInMs = now.getTime() - prev.getTime();
        const isDue = diffInMs >= 0 && diffInMs < 60000;

        if (isDue) {
          console.log(`[CRON] Triggering schedule: ${schedule.title} (ID: ${schedule.id})`);
          
          const project = schedule.project;
          const GITHUB_TOKEN = project.githubToken || process.env.GITHUB_TOKEN;
          const GITHUB_OWNER = project.githubOwner || process.env.GITHUB_OWNER;
          const GITHUB_REPO = project.githubRepo || process.env.GITHUB_REPO;
          const GITHUB_WORKFLOW_ID = project.githubWorkflowId || process.env.GITHUB_WORKFLOW_ID || "playwright.yml";

          if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
            console.error(`[CRON] GitHub integration missing for project: ${project.code}`);
            continue;
          }

          const testCases = await prisma.testCase.findMany({
            where: {
              projectId: project.id,
              automationStatus: 'AUTOMATED',
            }
          });

          if (testCases.length === 0) {
            console.log(`[CRON] No automated test cases found for project: ${project.code}`);
            continue;
          }

          // Create Test Run
          const run = await prisma.testRun.create({
            data: {
              title: `Scheduled Run: ${schedule.title}`,
              description: `Triggered automatically by Cron Engine at ${now.toISOString()}`,
              projectId: project.id,
              status: 'ACTIVE',
              results: {
                create: testCases.map(tc => ({
                  caseId: tc.id,
                  status: "IN_PROGRESS"
                }))
              }
            }
          });

          // Trigger GitHub Action
          const dispatchUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${GITHUB_WORKFLOW_ID}/dispatches`;
          
          const protocol = req.headers.get("x-forwarded-proto") || "http";
          const host = req.headers.get("host");
          const apiUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || `${protocol}://${host}`;

          const automatedShortIds = testCases.map(tc => {
            const shortId = tc.id.substring(0, 4);
            return `${project.code}-${shortId}`;
          }).join(' ');

          const ghRes = await fetch(dispatchUrl, {
            method: "POST",
            headers: {
              "Authorization": `token ${GITHUB_TOKEN}`,
              "Content-Type": "application/json",
              "Accept": "application/vnd.github.v3+json"
            },
            body: JSON.stringify({
              ref: "main",
              inputs: {
                run_id: run.id,
                case_ids: automatedShortIds,
                api_url: apiUrl
              }
            })
          });

          if (!ghRes.ok) {
            console.error(`[CRON] Failed to trigger GitHub Action for schedule ${schedule.id}`, await ghRes.text());
          } else {
            triggeredRunIds.push(run.id);
          }
        }
      } catch (err) {
        console.error(`[CRON] Failed to parse cron or trigger for schedule ${schedule.id}:`, err);
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: schedules.length,
      triggeredCount: triggeredRunIds.length,
      triggeredRunIds 
    });

  } catch (error: any) {
    console.error("[CRON] Error processing schedules:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
