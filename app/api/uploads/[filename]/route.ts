import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

export async function GET(
  req: NextRequest, 
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const resolvedParams = await params;
    const filename = resolvedParams.filename;
    
    // Prevent directory traversal
    if (filename.includes('..') || filename.includes('/')) {
      return new NextResponse('Bad Request', { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'public', 'uploads', filename);

    if (!existsSync(filePath)) {
      return new NextResponse('Not Found', { status: 404 });
    }

    const fileBuffer = await readFile(filePath);
    
    const ext = path.extname(filename).toLowerCase();
    let mimeType = 'application/octet-stream';
    if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
    else if (ext === '.gif') mimeType = 'image/gif';
    else if (ext === '.svg') mimeType = 'image/svg+xml';
    else if (ext === '.webp') mimeType = 'image/webp';
    else if (ext === '.pdf') mimeType = 'application/pdf';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
