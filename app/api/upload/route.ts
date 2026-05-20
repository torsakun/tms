import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const projectIdOrCode = formData.get("projectId") as string;

    if (!file || !projectIdOrCode) {
      return NextResponse.json(
        { error: "File and projectId are required" },
        { status: 400 }
      );
    }

    let project = await prisma.project.findFirst({
      where: {
        OR: [
          { id: projectIdOrCode },
          { code: projectIdOrCode }
        ]
      }
    });

    if (!project) {
      // Auto-create project to prevent 404s during development
      project = await prisma.project.create({
        data: {
          code: projectIdOrCode,
          name: projectIdOrCode + " Project"
        }
      });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize filename
    const safeFilename = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const uniqueFilename = `${Date.now()}-${safeFilename}`;
    
    // Save to public/uploads
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    
    const filePath = path.join(uploadDir, uniqueFilename);
    await writeFile(filePath, buffer);

    const fileUrl = `/api/uploads/${uniqueFilename}`;

    const attachment = await prisma.attachment.create({
      data: {
        filename: uniqueFilename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        url: fileUrl,
        projectId: project.id,
      },
    });

    return NextResponse.json(attachment, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
