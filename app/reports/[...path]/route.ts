import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import mime from 'mime';

export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: pathArray } = await params;
  
  try {
    const filePath = path.join(process.cwd(), 'public', 'reports', ...pathArray);
    
    // Security check to prevent directory traversal
    if (!filePath.startsWith(path.join(process.cwd(), 'public', 'reports'))) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    if (!fs.existsSync(filePath)) {
      return new NextResponse('Not Found', { status: 404 });
    }

    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const contentType = mime.getType(filePath) || 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error serving static file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
