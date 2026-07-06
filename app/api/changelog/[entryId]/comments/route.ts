import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { changelogEntries } from "@/db/schema";
import { getCurrentSession } from "@/lib/authz";
import {
  ChangelogCommentBlockedError,
  ChangelogCommentNotFoundError,
  createChangelogComment,
} from "@/lib/changelog-comments/create";
import { listChangelogComments } from "@/lib/changelog-comments/queries";
import { db } from "@/lib/db";
import { getWorkspaceMember } from "@/lib/workspaces/queries";

interface Params {
  params: Promise<{ entryId: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { entryId } = await params;
  const session = await getCurrentSession();

  const [entry] = await db
    .select({
      workspaceId: changelogEntries.workspaceId,
      isPublished: changelogEntries.isPublished,
    })
    .from(changelogEntries)
    .where(eq(changelogEntries.id, entryId))
    .limit(1);

  if (!entry) {
    return NextResponse.json({ error: "Entry not found." }, { status: 404 });
  }

  const isMember = session
    ? !!(await getWorkspaceMember(entry.workspaceId, session.user.id))
    : false;
  if (!entry.isPublished && !isMember) {
    return NextResponse.json({ error: "Entry not found." }, { status: 404 });
  }

  const comments = await listChangelogComments(entryId);
  return NextResponse.json(
    comments.map((c) => ({
      id: c.id,
      changelogEntryId: c.changelogEntryId,
      body: c.body,
      isDeleted: c.isDeleted,
      authorName: c.isDeleted ? null : c.authorName,
      authorAvatar: c.isDeleted ? null : c.authorAvatar,
      isGuest: !c.authorId,
      authorId: c.authorId,
      createdAt: c.createdAt,
    }))
  );
}

export async function POST(req: NextRequest, { params }: Params) {
  const { entryId } = await params;
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ error: "Sign in to comment." }, { status: 401 });
  }

  let body: { body?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const rawBody = typeof body.body === "string" ? body.body.trim() : "";
  if (!rawBody || rawBody.length < 1 || rawBody.length > 5000) {
    return NextResponse.json(
      { error: "Comment must be between 1 and 5000 characters." },
      { status: 422 }
    );
  }

  const [entry] = await db
    .select({ workspaceId: changelogEntries.workspaceId })
    .from(changelogEntries)
    .where(eq(changelogEntries.id, entryId))
    .limit(1);

  if (!entry) {
    return NextResponse.json({ error: "Entry not found." }, { status: 404 });
  }

  try {
    const comment = await createChangelogComment(
      entryId,
      { body: rawBody, authorId: session.user.id },
      entry.workspaceId
    );

    return NextResponse.json(
      {
        id: comment.id,
        changelogEntryId: comment.changelogEntryId,
        body: comment.body,
        isDeleted: false,
        authorName: comment.authorName,
        authorAvatar: comment.authorAvatar,
        isGuest: false,
        authorId: comment.authorId,
        createdAt: comment.createdAt,
      },
      { status: 201 }
    );
  } catch (err) {
    if (
      err instanceof ChangelogCommentNotFoundError ||
      err instanceof ChangelogCommentBlockedError
    ) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    console.error("[POST /api/changelog/[entryId]/comments]", err);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
