import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

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
    const reportsDir = path.join(process.cwd(), 'public', 'reports', runId);
    
    // Make sure the directory exists
    await fs.promises.mkdir(reportsDir, { recursive: true });

    const zipPath = path.join(reportsDir, 'report.zip');
    
    // Save the zip file
    await fs.promises.writeFile(zipPath, buffer);

    // Unzip the file and overwrite any existing files
    await execPromise(`unzip -o ${zipPath} -d ${reportsDir}`);
    
    // Clean up the zip file
    await fs.promises.unlink(zipPath);

    // Update the TestRun with the report URL
    await prisma.testRun.update({
      where: { id: runId },
      data: { reportUrl: `/reports/${runId}/playwright-report/index.html` }
    });

    return NextResponse.json({ success: true, message: 'Report uploaded successfully' });

  } catch (error: any) {
    console.error('Error handling report upload:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
