import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Escape a value for CSV (RFC 4180): wrap in quotes, double internal quotes.
function csv(value: unknown): string {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params;
    const project = await prisma.project.findUnique({
      where: { code },
      include: {
        suites: { select: { id: true, title: true } },
        testCases: {
          orderBy: { sequenceNumber: "asc" },
          include: {
            steps: { orderBy: { position: "asc" } },
            tags: { select: { name: true } },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const suiteName = new Map(project.suites.map((s) => [s.id, s.title]));

    const headers = [
      "ID",
      "Title",
      "Suite",
      "Priority",
      "Severity",
      "Automation",
      "Tags",
      "Preconditions",
      "Steps",
      "Expected Results",
      "Description",
    ];

    const rows = project.testCases.map((tc) => {
      const steps = tc.steps
        .map((s, i) => `${i + 1}. ${s.action || ""}`)
        .join("\n");
      const expected = tc.steps
        .map((s, i) => `${i + 1}. ${s.expectedResult || ""}`)
        .join("\n");
      return [
        `${project.code}-${tc.sequenceNumber}`,
        tc.title,
        tc.suiteId ? suiteName.get(tc.suiteId) || "" : "",
        tc.priority,
        tc.severity,
        tc.automationStatus,
        tc.tags.map((t) => t.name).join(", "),
        tc.preconditions || "",
        steps,
        expected,
        tc.description || "",
      ]
        .map(csv)
        .join(",");
    });

    // Prepend a BOM so Excel opens UTF-8 correctly.
    const body = "﻿" + [headers.join(","), ...rows].join("\r\n");

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${project.code}_test_cases.csv"`,
      },
    });
  } catch (error) {
    console.error("Failed to export CSV:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
