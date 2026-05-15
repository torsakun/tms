import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';

export async function POST(req: Request, { params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // The directory where we will save the report
    const isVercel = process.env.VERCEL === "1";
    const reportsDir = isVercel 
      ? path.join('/tmp', 'reports', runId)
      : path.join(process.cwd(), 'public', 'reports', runId);
    
    // Make sure the directory exists
    await fs.promises.mkdir(reportsDir, { recursive: true });

    const zipPath = path.join(reportsDir, 'report.zip');
    
    // Save the zip file
    await fs.promises.writeFile(zipPath, buffer);

    // Unzip the file and overwrite any existing files
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(reportsDir, true);
    
    // Clean up the zip file
    await fs.promises.unlink(zipPath);

    // Update the TestRun with the report URL and mark as COMPLETED
    await prisma.testRun.update({
      where: { id: runId },
      data: { 
        reportUrl: `/reports/${runId}/index.html`,
        status: 'COMPLETED'
      }
    });

    // Any tests that are still IN_PROGRESS should be marked as FAILED
    // because the test runner finished/crashed before reporting them.
    await prisma.testRunResult.updateMany({
      where: {
        runId,
        status: 'IN_PROGRESS'
      },
      data: {
        status: 'FAILED',
        comment: 'Test execution aborted, crashed, or timed out before completion.'
      }
    });

    return NextResponse.json({ success: true, message: 'Report uploaded successfully' });

  } catch (error: any) {
    console.error('Error handling report upload:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
