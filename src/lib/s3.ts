import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const endpoint = process.env.S3_ENDPOINT!; // e.g., http://localhost:9000
const accessKeyId = process.env.S3_ACCESS_KEY ?? process.env.MINIO_ROOT_USER;
const secretAccessKey = process.env.S3_SECRET_KEY ?? process.env.MINIO_ROOT_PASSWORD;

if (!accessKeyId || !secretAccessKey) {
  throw new Error(
    "Missing S3 credentials. Please set S3_ACCESS_KEY/S3_SECRET_KEY or MINIO_ROOT_USER/MINIO_ROOT_PASSWORD."
  );
}

export const s3 = new S3Client({
  region: process.env.S3_REGION || "us-east-1",
  endpoint,
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export async function presignPut(key: string, contentType: string) {
  const bucket = process.env.S3_BUCKET!;
  const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
  const url = await getSignedUrl(s3, cmd, { expiresIn: 60 * 5 });
  return { url, bucket, key };
}

export async function presignGet(key: string) {
  const bucket = process.env.S3_BUCKET!;
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
  const url = await getSignedUrl(s3, cmd, { expiresIn: 60 * 5 });
  return url;
}

export function publicUrl(key: string) {
  const bucket = process.env.S3_BUCKET!;
  const base = endpoint?.replace(/\/$/, "") ?? "";
  const normalizedKey = key
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  // Works for public assets if you've enabled anonymous read on the bucket
  return `${base}/${bucket}/${normalizedKey}`;
}
