import { and, desc, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { boards, posts } from "@/db/schema";
import { authenticateApiKey } from "@/lib/api-keys/auth";
import { db } from "@/lib/db";

// GET /api/v1/posts — list approved posts in the API key's workspace.
// Auth: `Authorization: Bearer <api-key>` (or `x-api-key`).
// Optional query params: ?limit=1-100 (default 50), ?boardSlug=<slug>.
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
  const boardSlug = req.nextUrl.searchParams.get("boardSlug");

  const conditions = [
    eq(posts.workspaceId, auth.workspaceId),
    eq(posts.isApproved, true),
    // Unpublished drafts are never exposed through the public API.
    eq(posts.isDraft, false),
    // Excludes private-board posts — this is a public API surface, not an
    // admin one, so it follows the same visibility rule as every public page.
    eq(boards.isPublic, true),
  ];

  if (boardSlug) {
    const [board] = await db
      .select({ id: boards.id })
      .from(boards)
      .where(
        and(
          eq(boards.workspaceId, auth.workspaceId),
          eq(boards.slug, boardSlug)
        )
      )
      .limit(1);
    if (!board) {
      return NextResponse.json({ error: "Board not found." }, { status: 404 });
    }
    conditions.push(eq(posts.boardId, board.id));
  }

  const rows = await db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      body: posts.body,
      status: posts.status,
      upvotes: posts.upvotes,
      commentCount: posts.commentCount,
      boardId: posts.boardId,
      categoryId: posts.categoryId,
      createdAt: posts.createdAt,
    })
    .from(posts)
    .innerJoin(boards, eq(posts.boardId, boards.id))
    .where(and(...conditions))
    .orderBy(desc(posts.createdAt))
    .limit(limit);

  return NextResponse.json({ data: rows });
}
