import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { requireProjectRole } from "@/lib/project-auth";
import crypto from "crypto";
import { generateInviteEmailHtml } from "@/lib/email-templates";
import { sendEmail } from "@/lib/mailer";

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
    const host = req.headers.get("host");
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const baseUrl = process.env.NEXTAUTH_URL || `${protocol}://${host}`;
    
    const inviteUrl = `${baseUrl}/accept-invite?token=${token}`;
    
    await sendEmail({
      to: email,
      subject: `You have been invited to join ${project.name} on TESSA TMS`,
      html: generateInviteEmailHtml({
        title: "You've been invited! 🚀",
        greeting: email,
        roleText: role,
        inviteLink: inviteUrl,
        projectName: project.name
      })
    });

    return NextResponse.json({ success: true, invitationId: invitation.id });
  } catch (error: any) {
    console.error("Failed to create invitation:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
