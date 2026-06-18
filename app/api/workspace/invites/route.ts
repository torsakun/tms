import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";
import { getSessionUser, unauthorized, forbidden } from "@/lib/api-auth";
import { canManageUsers } from "@/lib/permissions";
import { generateInviteEmailHtml } from "@/lib/email-templates";
import { sendEmail } from "@/lib/mailer";

export async function GET() {
  try {
    const invites = await prisma.invitation.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
    });

    const roles = await prisma.workspaceRole.findMany({
      select: { id: true, title: true },
    });
    const roleMap = roles.reduce((acc: any, role: any) => {
      acc[role.id] = role.title;
      return acc;
    }, {});

    const mappedInvites = invites.map((invite) => ({
      ...invite,
      accessRoleName: invite.roleId ? roleMap[invite.roleId] : "Member",
    }));

    return NextResponse.json({ success: true, invites: mappedInvites });
  } catch (error) {
    console.error("Failed to fetch invites:", error);
    return NextResponse.json(
      { error: "Failed to fetch invites" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const actor = await getSessionUser();
  if (!actor) return unauthorized();
  if (!canManageUsers(actor)) return forbidden();
  try {
    const body = await req.json();
    const { email, firstName, lastName, roleId } = body;

    if (!email || !firstName || !lastName || !roleId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists with this email" },
        { status: 400 },
      );
    }

    // Resolve role title from DB
    const role = await prisma.workspaceRole.findUnique({
      where: { id: roleId },
    });
    const roleTitle = role?.title || "Member";

    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await prisma.invitation.create({
      data: {
        email,
        firstName,
        lastName,
        token,
        roleTitle,
        roleId,
        expiresAt,
        status: "PENDING",
      },
    });

    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const host = req.headers.get("host");
    const baseUrl = process.env.NEXTAUTH_URL || `${protocol}://${host}`;
    const inviteLink = `${baseUrl}/invite/accept?token=${token}`;

    const emailResult = await sendEmail({
      to: email,
      subject: `You have been invited to join the TESSA workspace`,
      html: generateInviteEmailHtml({
        title: "Welcome to TESSA! 🚀",
        greeting: `${firstName} ${lastName}`,
        roleText: roleTitle,
        inviteLink,
        projectName: "TESSA Workspace",
      }),
    });

    if (!emailResult.success) {
      // Delete the invitation if email fails to prevent pending invitations that were never sent
      await prisma.invitation.delete({ where: { id: invitation.id } });
      return NextResponse.json(
        { error: `Failed to send email: ${emailResult.error}` },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, invitation }, { status: 201 });
  } catch (error) {
    console.error("Failed to create invitation:", error);
    return NextResponse.json(
      { error: "Failed to create invitation" },
      { status: 500 },
    );
  }
}
