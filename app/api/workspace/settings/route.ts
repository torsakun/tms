import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const settings = await prisma.workspaceSetting.findMany();
    // Convert to a simple key-value object
    const config = settings.reduce((acc: any, setting: any) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});
    
    // Obscure sensitive keys if needed for UI reading, but since it's an internal tool
    // and admins need to see if it's set, we'll just send a masked version
    const maskedConfig = { ...config };
    if (maskedConfig.OPENAI_API_KEY) maskedConfig.OPENAI_API_KEY = "••••••••••••••••••••••••••••" + maskedConfig.OPENAI_API_KEY.slice(-4);
    if (maskedConfig.GEMINI_API_KEY) maskedConfig.GEMINI_API_KEY = "••••••••••••••••••••••••••••" + maskedConfig.GEMINI_API_KEY.slice(-4);
    if (maskedConfig.CLAUDE_API_KEY) maskedConfig.CLAUDE_API_KEY = "••••••••••••••••••••••••••••" + maskedConfig.CLAUDE_API_KEY.slice(-4);
    if (maskedConfig.JIRA_API_TOKEN) maskedConfig.JIRA_API_TOKEN = "••••••••••••••••••••••••••••" + maskedConfig.JIRA_API_TOKEN.slice(-4);

    return NextResponse.json(maskedConfig);
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // body should be an object of key-value pairs to update
    // e.g. { OPENAI_API_KEY: "sk-...", GEMINI_API_KEY: "AIza..." }
    
    const updates = [];
    for (const [key, value] of Object.entries(body)) {
      if (typeof value === 'string' && value.trim() !== '' && !value.startsWith('••••')) {
        updates.push(
          prisma.workspaceSetting.upsert({
            where: { key },
            update: { value },
            create: { key, value }
          })
        );
      }
    }

    if (updates.length > 0) {
      await prisma.$transaction(updates);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
