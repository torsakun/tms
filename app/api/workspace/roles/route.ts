import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Lazy seeding for system roles if none exist
    const systemRoleCount = await prisma.workspaceRole.count({
      where: { isSystem: true }
    });
    
    if (systemRoleCount === 0) {
      await prisma.workspaceRole.createMany({
        data: [
          {
            title: "Owner",
            description: "Team owner has access to all features and available to manage all aspects of application.",
            isSystem: true,
            isDefault: false,
            permissions: ["all"]
          },
          {
            title: "Administrator",
            description: "A administrative role that is similar to owner.",
            isSystem: true,
            isDefault: false,
            permissions: ["all"]
          },
          {
            title: "Member",
            description: "A common role that grants access to basic Qase features.",
            isSystem: true,
            isDefault: true,
            permissions: ["tc-repository", "tc-create"] // Example default permissions
          }
        ]
      });
    }

    const roles = await prisma.workspaceRole.findMany({
      include: {
        _count: {
          select: { users: true }
        }
      },
      orderBy: [
        { isSystem: 'desc' },
        { createdAt: 'asc' }
      ]
    });

    return NextResponse.json({ success: true, roles });
  } catch (error) {
    console.error("Failed to fetch roles:", error);
    return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, isDefault, permissions } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // If this role is set to default, unset the old default
    if (isDefault) {
      await prisma.workspaceRole.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }

    const newRole = await prisma.workspaceRole.create({
      data: {
        title,
        description,
        isDefault: isDefault || false,
        permissions: permissions || [],
        isSystem: false, // User created roles are not system roles
      }
    });

    return NextResponse.json({ success: true, role: newRole }, { status: 201 });
  } catch (error) {
    console.error("Failed to create role:", error);
    return NextResponse.json({ error: "Failed to create role" }, { status: 500 });
  }
}
