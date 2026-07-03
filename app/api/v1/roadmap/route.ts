import { type NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/api-keys/auth";
import { listPostsForRoadmap } from "@/lib/roadmap/queries";

// GET /api/v1/roadmap — roadmap posts (planned/in_progress/completed) in the
// API key's workspace, grouped by status. Excludes private and archived boards.
// Auth: `Authorization: Bearer <api-key>` (or `x-api-key`).
export async function GET(req: NextRequest) {
  const auth = await authenticateApiKey(req);
  if (!auth) {
    return NextResponse.json(
      { error: "Invalid or missing API key." },
      { status: 401 }
    );
  }

  const data = await listPostsForRoadmap(auth.workspaceId, { isAdmin: false });

  return NextResponse.json({ data });
}
