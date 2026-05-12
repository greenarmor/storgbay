import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  type PutObjectCommandInput,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const internalEndpoint = process.env.S3_INTERNAL_ENDPOINT ?? process.env.S3_ENDPOINT; // e.g., http://127.0.0.1:9000
const publicEndpoint = process.env.S3_PUBLIC_ENDPOINT ?? internalEndpoint; // e.g., https://storgbay.online
const accessKeyId = process.env.S3_ACCESS_KEY ?? process.env.MINIO_ROOT_USER;
const secretAccessKey = process.env.S3_SECRET_KEY ?? process.env.MINIO_ROOT_PASSWORD;

let cachedInternalClient: S3Client | null = null;
let cachedPublicClient: S3Client | null = null;

function ensureCredentials() {
  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      "Missing S3 credentials. Please set S3_ACCESS_KEY/S3_SECRET_KEY or MINIO_ROOT_USER/MINIO_ROOT_PASSWORD."
    );
  }
}

function createClient(endpoint: string | undefined) {
  ensureCredentials();

  return new S3Client({
    region: process.env.S3_REGION || "us-east-1",
    endpoint,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    credentials: {
      accessKeyId: accessKeyId!,
      secretAccessKey: secretAccessKey!,
    },
  });
}

function ensureInternalClient() {
  if (!cachedInternalClient) {
    cachedInternalClient = createClient(internalEndpoint);
  }

  return cachedInternalClient;
}

function ensurePublicClient() {
  if (!cachedPublicClient) {
    cachedPublicClient = createClient(publicEndpoint);
  }

  return cachedPublicClient;
}

function encodeKey(key: string) {
  return key
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

export async function presignPut(key: string, contentType: string, contentLength?: number) {
  const bucket = process.env.S3_BUCKET!;
  const input: PutObjectCommandInput = { Bucket: bucket, Key: key, ContentType: contentType };
  if (typeof contentLength === "number" && Number.isFinite(contentLength) && contentLength >= 0) {
    input.ContentLength = contentLength;
  }
  const cmd = new PutObjectCommand(input);
  const url = await getSignedUrl(ensurePublicClient(), cmd, { expiresIn: 60 * 5 });
  return { url, bucket, key };
}

export async function presignGet(key: string) {
  const bucket = process.env.S3_BUCKET!;
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
  const url = await getSignedUrl(ensurePublicClient(), cmd, { expiresIn: 60 * 5 });
  return url;
}

export function publicUrl(key: string) {
  const bucket = process.env.S3_BUCKET;
  if (!bucket || !publicEndpoint) {
    return null;
  }

  const base = publicEndpoint.replace(/\/$/, "");
  const normalizedKey = encodeKey(key);
  // Works for public assets if you've enabled anonymous read on the bucket.
  // For the production proxy, set S3_PUBLIC_ENDPOINT=https://storgbay.online,
  // S3_BUCKET=uploads, and S3_FORCE_PATH_STYLE=true to produce /uploads/<key> URLs.
  return `${base}/${encodeURIComponent(bucket)}/${normalizedKey}`;
}

export async function deleteObject(key: string) {
  const bucket = process.env.S3_BUCKET!;
  const cmd = new DeleteObjectCommand({ Bucket: bucket, Key: key });
  await ensureInternalClient().send(cmd);
}
