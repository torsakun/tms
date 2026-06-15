import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, unauthorized, forbidden } from "@/lib/api-auth";
import { canManageWorkspace } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  try {
    const [customFields, disabledSetting] = await Promise.all([
      prisma.customField.findMany({
        orderBy: { order: 'asc' },
        include: { projects: { select: { id: true, code: true } } }
      }),
      prisma.workspaceSetting.findUnique({ where: { key: 'disabled_fields' } })
    ]);

    const disabledIds: string[] = disabledSetting ? JSON.parse(disabledSetting.value) : [];

    // DB overrides for system fields (created on first edit)
    const sysOverrides = Object.fromEntries(
      customFields.filter(f => f.isSystem && f.id.startsWith('sys-')).map(f => [f.id, f])
    );

    const SYS_DEFAULTS = [
      { id: 'sys-priority',              name: 'Priority',                       type: 'SELECT', isRequired: true,  order: 1  },
      { id: 'sys-severity',              name: 'Severity',                       type: 'SELECT', isRequired: true,  order: 2  },
      { id: 'sys-type',                  name: 'Type',                           type: 'SELECT', isRequired: true,  order: 3  },
      { id: 'sys-behavior',              name: 'Behavior',                       type: 'SELECT', isRequired: true,  order: 4  },
      { id: 'sys-description',           name: 'Description',                    type: 'TEXT',   isRequired: false, order: 5  },
      { id: 'sys-preconditions',         name: 'Pre-conditions',                 type: 'TEXT',   isRequired: false, order: 6  },
      { id: 'sys-postconditions',        name: 'Post-conditions',                type: 'TEXT',   isRequired: false, order: 7  },
      { id: 'sys-status',                name: 'Status',                         type: 'SELECT', isRequired: true,  order: 8  },
      { id: 'sys-automation-status-dep', name: 'Automation status (deprecated)', type: 'SELECT', isRequired: true,  order: 9  },
      { id: 'sys-automation-status',     name: 'Automation status',              type: 'SELECT', isRequired: true,  order: 10 },
    ];

    const systemFields = SYS_DEFAULTS.map(def => {
      const override = sysOverrides[def.id];
      return {
        id: def.id,
        name:       override?.name       ?? def.name,
        isRequired: override?.isRequired ?? def.isRequired,
        order:      override?.order      ?? def.order,
        type: def.type,
        group: 'SYSTEM',
        entity: 'Test case',
        isSystem: true,
        isGlobal: true,
        projects: 'All projects',
        projectIds: [],
        isActive: !disabledIds.includes(def.id),
      };
    });

    const formattedCustomFields = customFields.filter(f => !f.id.startsWith('sys-')).map(f => ({
      id: f.id,
      name: f.name,
      group: 'CUSTOM',
      entity: f.entity === 'TestCase' ? 'Test case' : f.entity,
      type: f.type,
      options: f.options,
      isRequired: f.isRequired,
      isSystem: f.isSystem,
      isGlobal: f.isGlobal,
      projects: f.isGlobal ? 'All projects' : `${f.projects.length} projects`,
      projectIds: f.projects.map((p: any) => p.id),
      projectCodes: f.projects.map((p: any) => p.code),
      order: f.order + 10,
      isActive: !disabledIds.includes(f.id),
    }));

    return NextResponse.json([...systemFields, ...formattedCustomFields]);
  } catch (error) {
    console.error("Error fetching fields:", error);
    return NextResponse.json({ error: "Failed to fetch fields" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const actor = await getSessionUser();
  if (!actor) return unauthorized();
  if (!canManageWorkspace(actor)) return forbidden();
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
