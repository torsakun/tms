import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ticketId = searchParams.get("ticketId");

    if (!ticketId) {
      return NextResponse.json({ error: "Ticket ID is required" }, { status: 400 });
    }

    const settings = await prisma.workspaceSetting.findMany({
      where: { key: { in: ["JIRA_DOMAIN", "JIRA_EMAIL", "JIRA_API_TOKEN"] } }
    });

    const domain = settings.find(s => s.key === "JIRA_DOMAIN")?.value;
    const email = settings.find(s => s.key === "JIRA_EMAIL")?.value;
    const token = settings.find(s => s.key === "JIRA_API_TOKEN")?.value;

    if (!domain || !email || !token) {
      return NextResponse.json({ 
        error: "Jira integration is not configured. Please set the Domain, Email, and Token in Workspace Settings." 
      }, { status: 400 });
    }

    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const apiUrl = `https://${cleanDomain}/rest/api/3/issue/${ticketId}`;
    
    const authHeader = `Basic ${Buffer.from(`${email}:${token}`).toString('base64')}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 404) return NextResponse.json({ error: `Jira ticket ${ticketId} not found.` }, { status: 404 });
      if (response.status === 401) return NextResponse.json({ error: "Jira Authentication failed. Check your API token." }, { status: 401 });
      throw new Error(`Jira API returned status: ${response.status}`);
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
    
    const descriptionText = descriptionNode ? extractTextFromAdf(descriptionNode) : "No Description";

    const fullRequirement = `[Jira Ticket: ${ticketId}]\nTitle: ${summary}\n\nDescription:\n${descriptionText.trim()}`;

    return NextResponse.json({ requirementText: fullRequirement });

  } catch (error: any) {
    console.error("Jira fetch error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch from Jira" }, { status: 500 });
  }
}
