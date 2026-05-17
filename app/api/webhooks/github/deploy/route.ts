import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-hub-signature-256");

    const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;

    if (WEBHOOK_SECRET) {
      if (!signature) {
        return NextResponse.json({ error: "No signature provided" }, { status: 401 });
      }
      const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
      const digest = `sha256=${hmac.update(rawBody).digest("hex")}`;
      if (signature !== digest) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);

    // Only deploy on push to main
    if (req.headers.get("x-github-event") === "push" && payload.ref === "refs/heads/main") {
      const commitHash = payload.head_commit?.id?.substring(0, 7) || "unknown";
      const commitMessage = payload.head_commit?.message || "Manual push";

      // Check if there's already a pending or building deployment
      const active = await prisma.deploymentLog.findFirst({
        where: { status: { in: ["PENDING", "BUILDING"] } }
      });

      if (!active) {
        await prisma.deploymentLog.create({
          data: {
            status: "PENDING",
            trigger: "GitHub Webhook",
            commitHash,
            commitMessage,
            logs: "Webhook received. Deployment queued..."
          }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
