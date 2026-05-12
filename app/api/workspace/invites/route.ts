import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";

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

    // Simulate sending email by logging to the server console
    const inviteLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/invite/accept?token=${token}`;
    
    console.log("\n" + "=".repeat(60));
    console.log(`📧 SIMULATED EMAIL TO: ${email}`);
    console.log(`Hello ${firstName} ${lastName},`);
    console.log(`You have been invited to join the workspace as a ${roleTitle}.`);
    console.log(`Please click the link below to accept the invitation and set your password:`);
    console.log(`👉 ${inviteLink}`);
    console.log("=".repeat(60) + "\n");

    return NextResponse.json({ success: true, invitation }, { status: 201 });
  } catch (error) {
    console.error("Failed to create invitation:", error);
    return NextResponse.json({ error: "Failed to create invitation" }, { status: 500 });
  }
}
