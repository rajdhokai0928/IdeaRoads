import { S3Client } from "@aws-sdk/client-s3";
import { env } from "@/lib/env";

let client: S3Client | null = null;

// Only called after lib/storage/index.ts's requireStorageConfig() has
// confirmed these are set, so the non-null assertions hold at runtime.
export function getS3Client(): S3Client {
  if (!client) {
    client = new S3Client({
      region: env.STORAGE_S3_REGION!,
      endpoint: env.STORAGE_S3_ENDPOINT,
      forcePathStyle: Boolean(env.STORAGE_S3_ENDPOINT),
      credentials: {
        accessKeyId: env.STORAGE_S3_ACCESS_KEY_ID!,
        secretAccessKey: env.STORAGE_S3_SECRET_ACCESS_KEY!,
      },
    });
  }
  return client;
}
