import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, S3_BUCKET } from "@/lib/s3";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  try {
    const { filename } = await params;

    // Prevent directory traversal
    if (filename.includes("..") || filename.includes("/")) {
      return new NextResponse("Bad Request", { status: 400 });
    }

    const obj = await s3Client.send(
      new GetObjectCommand({ Bucket: S3_BUCKET, Key: filename }),
    );

    // Stream the object back from our own origin so the image is same-origin.
    // Redirecting to a presigned S3 URL breaks CORS-loaded <img crossOrigin>
    // (e.g. the public report + PDF export), so we proxy the bytes instead.
    const bytes = await obj.Body!.transformToByteArray();

    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": obj.ContentType || "application/octet-stream",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving upload:", error);
    return new NextResponse("Not Found", { status: 404 });
  }
}
