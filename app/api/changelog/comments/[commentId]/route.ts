import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { WORKSPACE_MEMBER } from "@/config/platform";
import { changelogEntries } from "@/db/schema";
import { audit } from "@/lib/audit";
import { getCurrentSession } from "@/lib/authz";
import {
  ChangelogCommentDeleteError,
  deleteChangelogComment,
} from "@/lib/changelog-comments/delete";
import { getChangelogCommentById } from "@/lib/changelog-comments/queries";
import { db } from "@/lib/db";
import { getWorkspaceMember } from "@/lib/workspaces/queries";

interface Params {
  params: Promise<{ commentId: string }>;
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { commentId } = await params;

  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const comment = await getChangelogCommentById(commentId);
  if (!comment) {
    return NextResponse.json({ error: "Comment not found." }, { status: 404 });
  }

  const [entry] = await db
    .select({ workspaceId: changelogEntries.workspaceId })
    .from(changelogEntries)
    .where(eq(changelogEntries.id, comment.changelogEntryId))
    .limit(1);

  if (!entry) {
    return NextResponse.json({ error: "Entry not found." }, { status: 404 });
  }

  const member = await getWorkspaceMember(entry.workspaceId, session.user.id);
  const isAuthor = comment.authorId === session.user.id;
  if (!member && !isAuthor) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    await deleteChangelogComment(
      commentId,
      session.user.id,
      member?.role ?? WORKSPACE_MEMBER
    );
  } catch (err) {
    if (err instanceof ChangelogCommentDeleteError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    console.error("[DELETE /api/changelog/comments/[commentId]]", err);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }

  audit({
    action: "changelog_comment.deleted",
    actorId: session.user.id,
    actorEmail: session.user.email,
    entityType: "changelog_entry",
    entityId: comment.changelogEntryId,
    description: "Deleted changelog comment",
    metadata: { commentId, workspaceId: entry.workspaceId },
  });

  return new NextResponse(null, { status: 204 });
}
