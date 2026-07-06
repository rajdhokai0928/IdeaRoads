import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "@/lib/env";
import { getS3Client } from "@/lib/storage/client";

/** True once every var needed to talk to S3/R2 is set. */
export function isS3Configured(): boolean {
  return Boolean(
    env.STORAGE_S3_REGION &&
      env.STORAGE_S3_BUCKET &&
      env.STORAGE_S3_ACCESS_KEY_ID &&
      env.STORAGE_S3_SECRET_ACCESS_KEY &&
      env.STORAGE_PUBLIC_URL_BASE
  );
}

// Only called after the caller has checked isS3Configured(), so the
// non-null assertions below hold at runtime.

export async function uploadFileS3(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: env.STORAGE_S3_BUCKET!,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return `${env.STORAGE_PUBLIC_URL_BASE}/${key}`;
}

export async function deleteFileS3(url: string): Promise<void> {
  const prefix = `${env.STORAGE_PUBLIC_URL_BASE}/`;
  if (!url.startsWith(prefix)) {
    return;
  }
  const key = url.slice(prefix.length);

  await getS3Client().send(
    new DeleteObjectCommand({
      Bucket: env.STORAGE_S3_BUCKET!,
      Key: key,
    })
  );
}
