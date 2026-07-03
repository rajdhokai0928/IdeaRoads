import { type NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/api-keys/auth";
import { listChangelogEntries } from "@/lib/changelog/queries";

// GET /api/v1/changelog — list published changelog entries in the API key's
// workspace. Auth: `Authorization: Bearer <api-key>` (or `x-api-key`).
// Optional query params: ?limit=1-100 (default 50).
export async function GET(req: NextRequest) {
  const auth = await authenticateApiKey(req);
  if (!auth) {
    return NextResponse.json(
      { error: "Invalid or missing API key." },
      { status: 401 }
    );
  }

  const limitParam = Number(req.nextUrl.searchParams.get("limit"));
  const limit =
    Number.isFinite(limitParam) && limitParam > 0
      ? Math.min(limitParam, 100)
      : 50;

  const { entries } = await listChangelogEntries(auth.workspaceId, {
    limit,
  });

  const data = entries.map((entry) => ({
    id: entry.id,
    title: entry.title,
    body: entry.body,
    label: entry.label,
    publishedAt: entry.publishedAt,
    linkedPostCount: entry.linkedPostCount,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  }));

  return NextResponse.json({ data });
}
