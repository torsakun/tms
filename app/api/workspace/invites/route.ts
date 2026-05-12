import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";
import { Resend } from "resend";
import { generateInviteEmailHtml } from "@/lib/email-templates";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function GET() {
  try {
    const invites = await prisma.invitation.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" }
    });

    const roles = await prisma.workspaceRole.findMany({
      select: { id: true, title: true }
    });
    const roleMap = roles.reduce((acc: any, role: any) => {
      acc[role.id] = role.title;
      return acc;
    }, {});

    const mappedInvites = invites.map(invite => ({
      ...invite,
      accessRoleName: invite.roleId ? roleMap[invite.roleId] : "Member"
    }));

    return NextResponse.json({ success: true, invites: mappedInvites });
  } catch (error) {
    console.error("Failed to fetch invites:", error);
    return NextResponse.json({ error: "Failed to fetch invites" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, firstName, lastName, roleTitle, roleId } = body;

    if (!email || !firstName || !lastName || !roleTitle || !roleId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ error: "User already exists with this email" }, { status: 400 });
    }

    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    const invitation = await prisma.invitation.create({
      data: {
        email,
        firstName,
        lastName,
        token,
        roleTitle,
        roleId,
        expiresAt,
        status: "PENDING"
      }
    });

    // Send email via Resend
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const host = req.headers.get("host");
    const baseUrl = process.env.NEXTAUTH_URL || `${protocol}://${host}`;
    const inviteLink = `${baseUrl}/invite/accept?token=${token}`;
    
    if (resend) {
      await resend.emails.send({
        from: 'TESSA TMS <no-reply@resend.dev>',
        to: email,
        subject: `You have been invited to join the TESSA workspace`,
        html: generateInviteEmailHtml({
          title: "Welcome to TESSA! 🚀",
          greeting: `${firstName} ${lastName}`,
          roleText: roleTitle,
          inviteLink: inviteLink,
          projectName: "TESSA Workspace"
        })
      });
    } else {
      console.warn("RESEND_API_KEY is not set. The workspace invitation was created, but no email was sent.");
      console.log(`Simulated invite link: ${inviteLink}`);
    }

    return NextResponse.json({ success: true, invitation }, { status: 201 });
  } catch (error) {
    console.error("Failed to create invitation:", error);
    return NextResponse.json({ error: "Failed to create invitation" }, { status: 500 });
  }
}
