import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ticketId = searchParams.get("ticketId");

    if (!ticketId) {
      return NextResponse.json(
        { error: "Ticket ID is required" },
        { status: 400 },
      );
    }

    const settings = await prisma.workspaceSetting.findMany({
      where: { key: { in: ["JIRA_DOMAIN", "JIRA_EMAIL", "JIRA_API_TOKEN"] } },
    });

    const domain = settings.find((s) => s.key === "JIRA_DOMAIN")?.value;
    const email = settings.find((s) => s.key === "JIRA_EMAIL")?.value;
    const token = settings.find((s) => s.key === "JIRA_API_TOKEN")?.value;

    if (!domain || !email || !token) {
      return NextResponse.json(
        {
          error:
            "Jira integration is not configured. Please set the Domain, Email, and Token in Workspace Settings.",
        },
        { status: 400 },
      );
    }

    const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
    const apiUrl = `https://${cleanDomain}/rest/api/3/issue/${ticketId}`;

    const authHeader = `Basic ${Buffer.from(`${email}:${token}`).toString("base64")}`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      let jiraErrorText = "";
      try {
        const errorData = await response.json();
        jiraErrorText = JSON.stringify(errorData);
      } catch (e) {
        jiraErrorText = await response.text();
      }

      console.error(`Jira API failed (${response.status}):`, jiraErrorText);

      const loginReason = response.headers.get("x-seraph-loginreason");
      if (loginReason === "AUTHENTICATED_FAILED" || response.status === 401) {
        return NextResponse.json(
          {
            error:
              "Jira Authentication failed. Please check if your Jira Email and API Token are correct.",
          },
          { status: 401 },
        );
      }

      if (response.status === 404) {
        return NextResponse.json(
          {
            error: `Jira ticket ${ticketId} not found. If the ticket exists, your Jira token might not have permission to view it.`,
          },
          { status: 404 },
        );
      }
      throw new Error(
        `Jira API returned status: ${response.status} - ${jiraErrorText}`,
      );
    }

    const data = await response.json();

    // Parse Atlassian Document Format (ADF) recursively
    const extractTextFromAdf = (node: any): string => {
      if (!node) return "";
      if (node.type === "text") return node.text;

      let text = "";
      if (node.content && Array.isArray(node.content)) {
        for (const child of node.content) {
          text += extractTextFromAdf(child);
        }
      }

      // Add line breaks for block elements
      if (["paragraph", "heading", "listItem"].includes(node.type)) {
        text += "\n";
      }
      return text;
    };

    const summary = data.fields?.summary || "No Summary";
    const descriptionNode = data.fields?.description;

    const descriptionText = descriptionNode
      ? extractTextFromAdf(descriptionNode)
      : "No Description";

    const fullRequirement = `[Jira Ticket: ${ticketId}]\nTitle: ${summary}\n\nDescription:\n${descriptionText.trim()}`;

    // Fetch and process image attachments
    const attachments = data.fields?.attachment || [];
    const imageAttachments = attachments.filter(
      (att: any) => att.mimeType && att.mimeType.startsWith("image/"),
    );

    const imagesBase64: string[] = [];

    for (const att of imageAttachments) {
      if (!att.content) continue;
      try {
        const attResponse = await fetch(att.content, {
          method: "GET",
          headers: {
            Authorization: authHeader,
          },
        });

        if (attResponse.ok) {
          const buffer = await attResponse.arrayBuffer();
          const base64Data = Buffer.from(buffer).toString("base64");
          imagesBase64.push(`data:${att.mimeType};base64,${base64Data}`);
        } else {
          console.error(
            `Failed to fetch attachment ${att.id} (${att.filename}): Status ${attResponse.status}`,
          );
        }
      } catch (err) {
        console.error(`Error fetching attachment ${att.id}:`, err);
      }
    }

    return NextResponse.json({
      requirementText: fullRequirement,
      imagesBase64: imagesBase64,
    });
  } catch (error: any) {
    console.error("Jira fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch from Jira" },
      { status: 500 },
    );
  }
}
