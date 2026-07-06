import { and, asc, count, eq } from "drizzle-orm";
import { changelogComments } from "@/db/schema";
import { db } from "@/lib/db";

export async function listChangelogComments(changelogEntryId: string) {
  return db
    .select()
    .from(changelogComments)
    .where(eq(changelogComments.changelogEntryId, changelogEntryId))
    .orderBy(asc(changelogComments.createdAt));
}

export async function getChangelogCommentById(commentId: string) {
  const [row] = await db
    .select()
    .from(changelogComments)
    .where(eq(changelogComments.id, commentId))
    .limit(1);
  return row ?? null;
}

export async function getChangelogCommentCount(
  changelogEntryId: string
): Promise<number> {
  const [{ value }] = await db
    .select({ value: count() })
    .from(changelogComments)
    .where(
      and(
        eq(changelogComments.changelogEntryId, changelogEntryId),
        eq(changelogComments.isDeleted, false)
      )
    );
  return value;
}
