import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";
import { changelogComments, changelogEntries, user } from "@/db/schema";
import { db } from "@/lib/db";
import { isBlocked } from "@/lib/moderation/queries";

export class ChangelogCommentBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChangelogCommentBlockedError";
  }
}

export class ChangelogCommentNotFoundError extends Error {
  constructor(message = "Changelog entry not found.") {
    super(message);
    this.name = "ChangelogCommentNotFoundError";
  }
}

export async function createChangelogComment(
  changelogEntryId: string,
  input: { body: string; authorId: string },
  workspaceId: string
) {
  const entry = await db
    .select({
      id: changelogEntries.id,
      isPublished: changelogEntries.isPublished,
    })
    .from(changelogEntries)
    .where(eq(changelogEntries.id, changelogEntryId))
    .limit(1)
    .then((r) => r[0] ?? null);

  if (!entry?.isPublished) {
    throw new ChangelogCommentNotFoundError();
  }

  const blocked = await isBlocked(workspaceId, { userId: input.authorId });
  if (blocked) {
    throw new ChangelogCommentBlockedError(
      "You are not allowed to comment in this workspace."
    );
  }

  const userRow = await db
    .select({ name: user.name, image: user.image })
    .from(user)
    .where(eq(user.id, input.authorId))
    .limit(1)
    .then((r) => r[0] ?? null);

  const id = createId();
  await db.insert(changelogComments).values({
    id,
    changelogEntryId,
    body: input.body.trim(),
    authorId: input.authorId,
    authorName: userRow?.name ?? null,
    authorAvatar: userRow?.image ?? null,
  });

  return db
    .select()
    .from(changelogComments)
    .where(eq(changelogComments.id, id))
    .limit(1)
    .then((r) => r[0]!);
}
