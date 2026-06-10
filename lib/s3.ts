import { S3Client } from "@aws-sdk/client-s3";

const region = process.env.AWS_REGION || "ap-southeast-7";

// Check if access key is provided, otherwise let the SDK use the default credential provider chain (e.g. EC2 IAM Role)
const credentials = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
  ? {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
  : undefined;

export const s3Client = new S3Client({
  region,
  ...(credentials && { credentials }),
});

export const S3_BUCKET = process.env.AWS_S3_BUCKET || "s9-qa-tms";
