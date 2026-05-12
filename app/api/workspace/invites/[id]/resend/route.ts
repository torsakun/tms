import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
import { v4 as uuidv4 } from "uuid";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existingInvite = await prisma.invitation.findUnique({
      where: { id }
    });

    if (!existingInvite) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const updatedInvite = await prisma.invitation.update({
      where: { id },
      data: {
        token,
        expiresAt
      }
    });

    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const host = req.headers.get("host");
    const baseUrl = process.env.NEXTAUTH_URL || `${protocol}://${host}`;
    const inviteLink = `${baseUrl}/invite/accept?token=${updatedInvite.token}`;
    
    if (resend) {
      await resend.emails.send({
        from: 'TESSA TMS <no-reply@resend.dev>',
        to: updatedInvite.email,
        subject: `Reminder: You have been invited to join the TESSA workspace`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #2563eb;">Welcome to TESSA!</h2>
            <p>Hello ${updatedInvite.firstName} ${updatedInvite.lastName},</p>
            <p>This is a reminder that you have been invited to join the workspace as a <strong>${updatedInvite.roleTitle}</strong>.</p>
            <div style="margin: 30px 0;">
              <a href="${inviteLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Accept Invitation & Set Password</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #6b7280; font-size: 14px;">${inviteLink}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;" />
            <p style="font-size: 12px; color: #9ca3af;">If you didn't expect this invitation, you can safely ignore this email. This link will expire in 7 days.</p>
          </div>
        `
      });
    } else {
      console.warn("RESEND_API_KEY is not set. The workspace invitation was resent, but no email was actually dispatched.");
      console.log(`Simulated resend link: ${inviteLink}`);
    }

    return NextResponse.json({ success: true, invitation: updatedInvite });
  } catch (error) {
    console.error("Failed to resend invitation:", error);
    return NextResponse.json({ error: "Failed to resend invitation" }, { status: 500 });
  }
}
