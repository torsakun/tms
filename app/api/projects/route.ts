import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Prisma, ProjectAccessType } from "@prisma/client";

type MemberAccess = "all" | "group" | "none";

const MEMBER_ACCESS_VALUES = new Set<MemberAccess>(["all", "group", "none"]);

function normalizeAccessType(accessType: unknown): ProjectAccessType {
  return accessType === ProjectAccessType.PRIVATE
    ? ProjectAccessType.PRIVATE
    : ProjectAccessType.PUBLIC;
}

function normalizeMemberAccess(memberAccess: unknown): MemberAccess {
  return typeof memberAccess === "string" &&
    MEMBER_ACCESS_VALUES.has(memberAccess as MemberAccess)
    ? (memberAccess as MemberAccess)
    : "none";
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const creatorId = (session.user as { id?: string }).id;
    if (!creatorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, code, description, groupIds } = body;
    const accessType = normalizeAccessType(body.accessType);
    const memberAccess = normalizeMemberAccess(body.memberAccess);
    const selectedGroupIds = Array.isArray(groupIds)
      ? groupIds.filter((groupId) => typeof groupId === "string")
      : [];

    if (!name || !code) {
      return NextResponse.json(
        { error: "Name and Code are required" },
        { status: 400 },
      );
    }

    // Ensure code is uppercase and valid
    const formattedCode = code.toUpperCase().replace(/[^A-Z0-9]/g, "");

    // Check if project with code already exists
    const existing = await prisma.project.findUnique({
      where: { code: formattedCode },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Project code already exists" },
        { status: 400 },
      );
    }

    if (memberAccess === "group" && selectedGroupIds.length === 0) {
      return NextResponse.json(
        { error: "Choose at least one group for group access" },
        { status: 400 },
      );
    }

    const memberUserIds = new Set<string>([creatorId]);
    if (memberAccess === "all") {
      const users = await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true },
      });
      users.forEach((user) => memberUserIds.add(user.id));
    }

    if (memberAccess === "group") {
      const groups = await prisma.group.findMany({
        where: { id: { in: selectedGroupIds } },
        select: {
          id: true,
          members: { select: { id: true } },
        },
      });

      if (groups.length !== selectedGroupIds.length) {
        return NextResponse.json(
          { error: "One or more groups were not found" },
          { status: 400 },
        );
      }

      groups.forEach((group) => {
        group.members.forEach((member) => memberUserIds.add(member.id));
      });
    }

    const members: Prisma.ProjectMemberCreateWithoutProjectInput[] = Array.from(
      memberUserIds,
    ).map((userId) => ({
      user: { connect: { id: userId } },
      role: userId === creatorId ? "ADMIN" : "VIEWER",
    }));

    const project = await prisma.project.create({
      data: {
        name,
        code: formattedCode,
        description,
        accessType,
        groups:
          memberAccess === "group"
            ? { connect: selectedGroupIds.map((id) => ({ id })) }
            : undefined,
        members: { create: members },
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Failed to create project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        code: true,
      },
    });
    return NextResponse.json(projects);
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 },
    );
  }
}
