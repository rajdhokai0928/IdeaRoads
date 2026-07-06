import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "@/lib/env";
import { adminBaseUrl } from "@/lib/urls";

// Default local storage root. Next.js serves everything under public/
// directly off disk at request time (no `output: "standalone"` bundling
// here), so writes here are immediately reachable at /uploads/<key> — no
// separate serving route needed. Fine for a single-server/self-hosted
// deployment; configure STORAGE_S3_* for anything multi-instance.
const LOCAL_DIR =
  env.STORAGE_LOCAL_DIR ?? path.join(process.cwd(), "public", "uploads");

function publicUrlBase(): string {
  // Uploaded assets (avatars, post/changelog images) are served off disk by the
  // same app on any host; store them under the stable admin host. They are not
  // cookie-gated, so they load fine when displayed on the portal host too.
  return `${adminBaseUrl()}/uploads`;
}

export async function uploadFileLocal(
  key: string,
  buffer: Buffer
): Promise<string> {
  const filePath = path.join(LOCAL_DIR, key);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, buffer);
  return `${publicUrlBase()}/${key}`;
}

export async function deleteFileLocal(url: string): Promise<void> {
  const prefix = `${publicUrlBase()}/`;
  if (!url.startsWith(prefix)) {
    return;
  }
  const key = url.slice(prefix.length);
  await unlink(path.join(LOCAL_DIR, key)).catch((err) => {
    if (err.code !== "ENOENT") {
      throw err;
    }
  });
}
