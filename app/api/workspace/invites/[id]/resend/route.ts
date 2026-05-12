import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

    const inviteLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/invite/accept?token=${token}`;
    
    console.log("\n" + "=".repeat(60));
    console.log(`📧 SIMULATED EMAIL TO: ${existingInvite.email}`);
    console.log(`Hello,`);
    console.log(`Your invitation to join the workspace has been resent.`);
    console.log(`Please click the link below to accept the invitation and set your password:`);
    console.log(`👉 ${inviteLink}`);
    console.log("=".repeat(60) + "\n");

    return NextResponse.json({ success: true, invitation: updatedInvite });
  } catch (error) {
    console.error("Failed to resend invitation:", error);
    return NextResponse.json({ error: "Failed to resend invitation" }, { status: 500 });
  }
}
