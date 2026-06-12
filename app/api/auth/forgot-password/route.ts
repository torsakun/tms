import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";
import { sendEmail } from "@/lib/mailer";
import { generateResetEmailHtml } from "@/lib/email-templates";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Only act when the account exists and is active — but always respond the same
    // way to avoid leaking which emails are registered (no account enumeration).
    if (user && user.isActive) {
      const token = uuidv4();
      const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours

      await prisma.passwordResetToken.create({
        data: { token, userId: user.id, expiresAt },
      });

      const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
      const host = req.headers.get("host");
      const baseUrl = process.env.NEXTAUTH_URL || `${protocol}://${host}`;
      const resetLink = `${baseUrl}/reset-password?token=${token}`;

      // Best-effort email; failure (e.g. SMTP not configured) must not change the response.
      await sendEmail({
        to: email,
        subject: "Reset your TESSA password",
        html: generateResetEmailHtml({
          greeting: `Hi ${user.name || email.split("@")[0]},`,
          resetLink,
          projectName: "TESSA TMS",
        }),
      }).catch((e) => console.error("Reset email failed:", e));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot password failed:", error);
    // Still return success to avoid leaking internal state
    return NextResponse.json({ success: true });
  }
}
