import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";
import { sendEmail } from "@/lib/mailer";
import { generateResetEmailHtml } from "@/lib/email-templates";
import { canManageWorkspace } from "@/lib/permissions";

// Admin-initiated password reset: generates a reset link for a user, emails it,
// and returns the link so the admin can share it manually if email is unavailable.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const currentUser = await prisma.user.findUnique({ where: { email: session.user.email }, include: { workspaceRole: true } });
    if (!canManageWorkspace(currentUser)) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { id: userId } = await params;
    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h for admin-issued links
    await prisma.passwordResetToken.create({ data: { token, userId: target.id, expiresAt } });

    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const host = req.headers.get("host");
    const baseUrl = process.env.NEXTAUTH_URL || `${protocol}://${host}`;
    const resetLink = `${baseUrl}/reset-password?token=${token}`;

    const emailResult = await sendEmail({
      to: target.email,
      subject: "Reset your TESSA password",
      html: generateResetEmailHtml({
        greeting: `Hi ${target.name || target.email.split("@")[0]},`,
        resetLink,
        projectName: "TESSA TMS",
        expiresHours: 24,
      }),
    }).catch(() => ({ success: false }));

    return NextResponse.json({ success: true, resetLink, emailed: !!emailResult?.success });
  } catch (error) {
    console.error("Admin reset password failed:", error);
    return NextResponse.json({ error: "Failed to generate reset link" }, { status: 500 });
  }
}
