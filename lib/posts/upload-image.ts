import { uploadFile } from "@/lib/storage";

// Business logic shared between uploadPostImageAction (Server Action) and
// app/api/embed/posts/upload-image (Route Handler) — see submit-feedback.ts
// for why this split exists. No environment-specific code here at all, so
// this is a near-verbatim extraction.

const MAX_POST_IMAGE_BYTES = 4 * 1024 * 1024;
const ALLOWED_POST_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

export type UploadPostImageResult =
  | { data: { url: string }; ok: true }
  | { error: string; ok: false };

export async function uploadPostImage(
  userId: string,
  file: File | null
): Promise<UploadPostImageResult> {
  if (!file || file.size === 0) {
    return { ok: false, error: "Choose an image to upload." };
  }
  if (!ALLOWED_POST_IMAGE_TYPES.has(file.type)) {
    return { ok: false, error: "Use a PNG, JPEG, WEBP, or GIF image." };
  }
  if (file.size > MAX_POST_IMAGE_BYTES) {
    return { ok: false, error: "Image must be 4MB or smaller." };
  }

  const extension = file.type.split("/")[1];
  const buffer = Buffer.from(await file.arrayBuffer());
  const url = await uploadFile(
    `posts/${userId}-${Date.now()}.${extension}`,
    buffer,
    file.type
  );

  return { ok: true, data: { url } };
}
