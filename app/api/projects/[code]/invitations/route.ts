import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { requireProjectRole } from "@/lib/project-auth";
import crypto from "crypto";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasAccess = await requireProjectRole(code, (session.user as any).id, ['ADMIN']);
    if (!hasAccess && (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const project = await prisma.project.findUnique({
      where: { code }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const body = await req.json();
    const { email, role } = body;

    if (!email || !role) {
      return NextResponse.json({ error: "Email and role are required" }, { status: 400 });
    }

    // Check if user is already a member
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const existingMember = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: existingUser.id, projectId: project.id } }
      });
      if (existingMember) {
        return NextResponse.json({ error: "User is already a member of this project" }, { status: 400 });
      }
    }

    // Create Invitation
    const token = crypto.randomBytes(32).toString('hex');
    // Expire in 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Upsert to handle re-invites
    const invitation = await prisma.projectInvitation.upsert({
      where: {
        email_projectId: {
          email,
          projectId: project.id
        }
      },
      update: {
        token,
        role,
        expiresAt
      },
      create: {
        email,
        projectId: project.id,
        role,
        token,
        expiresAt
      }
    });

    // Send email via Resend
    if (resend) {
      // Determine the base URL
      const host = req.headers.get("host");
      const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
      const baseUrl = process.env.NEXTAUTH_URL || `${protocol}://${host}`;
      
      const inviteUrl = `${baseUrl}/accept-invite?token=${token}`;
      
      await resend.emails.send({
        from: 'TESSA TMS <no-reply@resend.dev>', // Use a verified domain or resend.dev for testing
        to: email,
        subject: `You have been invited to join ${project.name} on TESSA TMS`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #2563eb;">You're Invited!</h2>
            <p>Hello,</p>
            <p>You have been invited by <strong>${session.user.name || session.user.email}</strong> to join the <strong>${project.name}</strong> project as a <strong>${role}</strong>.</p>
            <div style="margin: 30px 0;">
              <a href="${inviteUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Accept Invitation</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #6b7280; font-size: 14px;">${inviteUrl}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;" />
            <p style="font-size: 12px; color: #9ca3af;">If you didn't expect this invitation, you can safely ignore this email. This link will expire in 7 days.</p>
          </div>
        `
      });
    } else {
      console.warn("RESEND_API_KEY is not set. The invitation was created in the database, but no email was sent.");
    }

    return NextResponse.json({ success: true, invitationId: invitation.id });
  } catch (error: any) {
    console.error("Failed to create invitation:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
