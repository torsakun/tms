import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateInviteEmailHtml } from "@/lib/email-templates";
import { sendEmail } from "@/lib/mailer";
import { v4 as uuidv4 } from "uuid";
import { getSessionUser, unauthorized, forbidden } from "@/lib/api-auth";
import { canManageUsers } from "@/lib/permissions";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await getSessionUser();
  if (!actor) return unauthorized();
  if (!canManageUsers(actor)) return forbidden();
  try {
    const { id } = await params;

    const existingInvite = await prisma.invitation.findUnique({
      where: { id },
    });

    if (!existingInvite) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 },
      );
    }

    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const updatedInvite = await prisma.invitation.update({
      where: { id },
      data: {
        token,
        expiresAt,
      },
    });

    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const host = req.headers.get("host");
    const baseUrl = process.env.NEXTAUTH_URL || `${protocol}://${host}`;
    const inviteLink = `${baseUrl}/invite/accept?token=${updatedInvite.token}`;

    const emailResult = await sendEmail({
      to: updatedInvite.email,
      subject: `Reminder: You have been invited to join the TESSA workspace`,
      html: generateInviteEmailHtml({
        title: "Reminder: You've been invited! 🚀",
        greeting: `${updatedInvite.firstName} ${updatedInvite.lastName}`,
        roleText: updatedInvite.roleTitle || "Member",
        inviteLink: inviteLink,
        projectName: "TESSA Workspace",
      }),
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { error: `Failed to send email: ${emailResult.error}` },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, invitation: updatedInvite });
  } catch (error) {
    console.error("Failed to resend invitation:", error);
    return NextResponse.json(
      { error: "Failed to resend invitation" },
      { status: 500 },
    );
  }
}
