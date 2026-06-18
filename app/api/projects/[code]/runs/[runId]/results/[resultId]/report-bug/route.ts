import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Build a minimal Atlassian Document Format (ADF) body for the description
function buildADF(description: string, steps: string[]) {
  const content: any[] = [
    {
      type: "paragraph",
      content: [{ type: "text", text: description || "(no description)" }],
    },
  ];
  if (steps && steps.length) {
    content.push({
      type: "heading",
      attrs: { level: 4 },
      content: [{ type: "text", text: "Steps to reproduce" }],
    });
    content.push({
      type: "orderedList",
      content: steps.map((s) => ({
        type: "listItem",
        content: [{ type: "paragraph", content: [{ type: "text", text: s }] }],
      })),
    });
  }
  return { type: "doc", version: 1, content };
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string; resultId: string }> },
) {
  try {
    const { code, resultId } = await params;
    const body = await req.json();
    const { summary, description, severity, stepsToReproduce } = body;

    if (!summary?.trim()) {
      return NextResponse.json(
        { error: "Bug summary is required" },
        { status: 400 },
      );
    }

    const project = await prisma.project.findFirst({
      where: { OR: [{ id: code }, { code }] },
    });
    if (!project)
      return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const result = await prisma.testRunResult.findUnique({
      where: { id: resultId },
      select: { id: true, caseId: true },
    });
    if (!result)
      return NextResponse.json(
        { error: "Test result not found" },
        { status: 404 },
      );

    // Jira credentials
    const settings = await prisma.workspaceSetting.findMany({
      where: {
        key: {
          in: [
            "JIRA_DOMAIN",
            "JIRA_EMAIL",
            "JIRA_API_TOKEN",
            "JIRA_PROJECT_KEY",
          ],
        },
      },
    });
    const get = (k: string) => settings.find((s) => s.key === k)?.value;
    const domain = get("JIRA_DOMAIN");
    const email = get("JIRA_EMAIL");
    const token = get("JIRA_API_TOKEN");
    const projectKey = (
      body.projectKey ||
      get("JIRA_PROJECT_KEY") ||
      ""
    ).trim();

    if (!domain || !email || !token) {
      return NextResponse.json(
        {
          error:
            "Jira integration is not configured. Set Domain, Email and Token in Workspace Settings.",
        },
        { status: 400 },
      );
    }
    if (!projectKey) {
      return NextResponse.json(
        {
          error:
            "Jira project key is missing. Set JIRA_PROJECT_KEY in Workspace Settings or pass projectKey.",
        },
        { status: 400 },
      );
    }

    const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
    const authHeader = `Basic ${Buffer.from(`${email}:${token}`).toString("base64")}`;

    const createRes = await fetch(`https://${cleanDomain}/rest/api/3/issue`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        fields: {
          project: { key: projectKey },
          summary: summary.trim(),
          issuetype: { name: "Bug" },
          description: buildADF(
            description || "",
            Array.isArray(stepsToReproduce) ? stepsToReproduce : [],
          ),
        },
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      console.error("Jira create failed:", createRes.status, errText);
      return NextResponse.json(
        {
          error: `Jira rejected the issue (${createRes.status}). Check project key & permissions.`,
        },
        { status: 502 },
      );
    }

    const created = await createRes.json();
    const key = created.key as string;
    const url = `https://${cleanDomain}/browse/${key}`;

    const linked = await prisma.linkedIssue.create({
      data: {
        provider: "JIRA",
        key,
        url,
        summary: summary.trim(),
        severity: severity || null,
        projectId: project.id,
        caseId: result.caseId || null,
        resultId: result.id,
      },
    });

    return NextResponse.json({ success: true, issue: linked }, { status: 201 });
  } catch (error: any) {
    console.error("Report bug failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to report bug" },
      { status: 500 },
    );
  }
}
