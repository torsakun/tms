import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { generateInviteEmailHtml } from "@/lib/email-templates";

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
        html: generateInviteEmailHtml({
          title: "Reminder: You've been invited! 🚀",
          greeting: `${updatedInvite.firstName} ${updatedInvite.lastName}`,
          roleText: updatedInvite.roleTitle || "Member",
          inviteLink: inviteLink,
          projectName: "TESSA Workspace"
        })
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
