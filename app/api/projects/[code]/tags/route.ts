import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const tagSchema = z.object({
  name: z.string().min(1),
});

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  try {
    const body = await req.json();
    const validatedData = tagSchema.parse(body);

    const tag = await prisma.tag.create({
      data: {
        name: validatedData.name,
        projectId: code,
      }
    });

    return NextResponse.json(tag, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Tag already exists in this project" }, { status: 409 });
    }
    return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const tags = await prisma.tag.findMany({
    where: { projectId: code },
    orderBy: { name: 'asc' }
  });
  return NextResponse.json(tags);
}
