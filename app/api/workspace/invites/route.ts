import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";
import { Resend } from "resend";

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
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #2563eb;">Welcome to TESSA!</h2>
            <p>Hello ${firstName} ${lastName},</p>
            <p>You have been invited to join the workspace as a <strong>${roleTitle}</strong>.</p>
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
      console.warn("RESEND_API_KEY is not set. The workspace invitation was created, but no email was sent.");
      console.log(`Simulated invite link: ${inviteLink}`);
    }

    return NextResponse.json({ success: true, invitation }, { status: 201 });
  } catch (error) {
    console.error("Failed to create invitation:", error);
    return NextResponse.json({ error: "Failed to create invitation" }, { status: 500 });
  }
}
