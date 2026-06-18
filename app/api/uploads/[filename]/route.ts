import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client, S3_BUCKET } from "@/lib/s3";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  try {
    const resolvedParams = await params;
    const filename = resolvedParams.filename;

    // Prevent directory traversal
    if (filename.includes("..") || filename.includes("/")) {
      return new NextResponse("Bad Request", { status: 400 });
    }

    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: filename,
    });

    // Generate a presigned URL valid for 1 hour
    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });

    return NextResponse.redirect(signedUrl);
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
