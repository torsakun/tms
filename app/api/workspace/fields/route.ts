import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const customFields = await prisma.customField.findMany({
      orderBy: { order: 'asc' },
      include: {
        projects: {
          select: { id: true, code: true }
        }
      }
    });

    // Mock system fields as requested
    const systemFields = [
      { id: 'sys-priority', name: 'Priority', group: 'SYSTEM', entity: 'Test case', type: 'SELECT', isRequired: true, isSystem: true, projects: 'All projects', order: 1 },
      { id: 'sys-severity', name: 'Severity', group: 'SYSTEM', entity: 'Test case', type: 'SELECT', isRequired: true, isSystem: true, projects: 'All projects', order: 2 },
      { id: 'sys-type', name: 'Type', group: 'SYSTEM', entity: 'Test case', type: 'SELECT', isRequired: true, isSystem: true, projects: 'All projects', order: 3 },
      { id: 'sys-behavior', name: 'Behavior', group: 'SYSTEM', entity: 'Test case', type: 'SELECT', isRequired: true, isSystem: true, projects: 'All projects', order: 4 },
      { id: 'sys-description', name: 'Description', group: 'SYSTEM', entity: 'Test case', type: 'TEXT', isRequired: false, isSystem: true, projects: 'All projects', order: 5 },
      { id: 'sys-preconditions', name: 'Pre-conditions', group: 'SYSTEM', entity: 'Test case', type: 'TEXT', isRequired: false, isSystem: true, projects: 'All projects', order: 6 },
      { id: 'sys-postconditions', name: 'Post-conditions', group: 'SYSTEM', entity: 'Test case', type: 'TEXT', isRequired: false, isSystem: true, projects: 'All projects', order: 7 },
      { id: 'sys-status', name: 'Status', group: 'SYSTEM', entity: 'Test case', type: 'SELECT', isRequired: true, isSystem: true, projects: 'All projects', order: 8 },
      { id: 'sys-automation-status-dep', name: 'Automation status (deprecated)', group: 'SYSTEM', entity: 'Test case', type: 'SELECT', isRequired: true, isSystem: true, projects: 'All projects', order: 9 },
      { id: 'sys-automation-status', name: 'Automation status', group: 'SYSTEM', entity: 'Test case', type: 'SELECT', isRequired: true, isSystem: true, projects: 'All projects', order: 10 },
    ];

    const formattedCustomFields = customFields.map(f => ({
      id: f.id,
      name: f.name,
      group: 'CUSTOM',
      entity: f.entity === 'TestCase' ? 'Test case' : f.entity,
      type: f.type,
      options: f.options,
      isRequired: f.isRequired,
      isSystem: f.isSystem,
      projects: f.isGlobal ? 'All projects' : `${f.projects.length} projects`,
      projectIds: f.projects.map((p: any) => p.id), // For UI to know which projects are selected
      projectCodes: f.projects.map((p: any) => p.code), // For filtering on test case creation
      order: f.order + 10 // push below system fields
    }));

    return NextResponse.json([...systemFields, ...formattedCustomFields]);
  } catch (error) {
    console.error("Error fetching fields:", error);
    return NextResponse.json({ error: "Failed to fetch fields" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, type, options, isRequired, isGlobal, projectIds } = body;

    if (!name || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const isGlobalVal = isGlobal !== false;

    const field = await prisma.customField.create({
      data: {
        name,
        type,
        options: options || null,
        isRequired: !!isRequired,
        isGlobal: isGlobalVal,
        entity: "TestCase",
        isSystem: false,
        projects: !isGlobalVal && Array.isArray(projectIds) && projectIds.length > 0
          ? { connect: projectIds.map((id: string) => ({ id })) }
          : undefined
      }
    });

    return NextResponse.json(field);
  } catch (error) {
    console.error("Error creating custom field:", error);
    return NextResponse.json({ error: "Failed to create field" }, { status: 500 });
  }
}
