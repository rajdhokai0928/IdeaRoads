import { and, eq, inArray, sql } from "drizzle-orm";
import { REACTION_EMOJIS } from "@/config/platform";
import {
  changelogCommentReactions,
  changelogEntryReactions,
} from "@/db/schema";
import { db } from "@/lib/db";

export type { ReactionEmoji } from "@/config/platform";
export { REACTION_EMOJIS } from "@/config/platform";

export interface ReactionGroup {
  count: number;
  emoji: string;
  hasReacted: boolean;
}

export async function getReactionsForEntry(
  changelogEntryId: string,
  userId?: string | null
): Promise<ReactionGroup[]> {
  const rows = await db
    .select({
      emoji: changelogEntryReactions.emoji,
      count: sql<number>`count(*)::int`,
      hasReacted: userId
        ? sql<boolean>`bool_or(${changelogEntryReactions.userId} = ${userId})`
        : sql<boolean>`false`,
    })
    .from(changelogEntryReactions)
    .where(eq(changelogEntryReactions.changelogEntryId, changelogEntryId))
    .groupBy(changelogEntryReactions.emoji);

  return rows.map((row) => ({
    emoji: row.emoji,
    count: row.count,
    hasReacted: row.hasReacted,
  }));
}

export async function toggleEntryReaction(
  changelogEntryId: string,
  emoji: string,
  userId: string
): Promise<{ added: boolean }> {
  if (!(REACTION_EMOJIS as readonly string[]).includes(emoji)) {
    throw new Error("Invalid emoji.");
  }

  const existing = await db
    .select({ id: changelogEntryReactions.id })
    .from(changelogEntryReactions)
    .where(
      and(
        eq(changelogEntryReactions.changelogEntryId, changelogEntryId),
        eq(changelogEntryReactions.userId, userId),
        eq(changelogEntryReactions.emoji, emoji)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .delete(changelogEntryReactions)
      .where(eq(changelogEntryReactions.id, existing[0]!.id));
    return { added: false };
  }

  const id = (await import("@paralleldrive/cuid2")).createId();
  await db
    .insert(changelogEntryReactions)
    .values({ id, changelogEntryId, userId, emoji });
  return { added: true };
}

// ─── Per-comment reactions ────────────────────────────────────────────────────
// Mirrors lib/comments/reactions.ts so the shared reactions UI works on
// changelog comments exactly as it does on feedback comments.

export async function getReactionsForChangelogComments(
  commentIds: string[],
  userId?: string | null
): Promise<Map<string, ReactionGroup[]>> {
  if (commentIds.length === 0) {
    return new Map();
  }

  const rows = await db
    .select({
      commentId: changelogCommentReactions.commentId,
      emoji: changelogCommentReactions.emoji,
      count: sql<number>`count(*)::int`,
      hasReacted: userId
        ? sql<boolean>`bool_or(${changelogCommentReactions.userId} = ${userId})`
        : sql<boolean>`false`,
    })
    .from(changelogCommentReactions)
    .where(inArray(changelogCommentReactions.commentId, commentIds))
    .groupBy(
      changelogCommentReactions.commentId,
      changelogCommentReactions.emoji
    );

  const map = new Map<string, ReactionGroup[]>();
  for (const row of rows) {
    const existing = map.get(row.commentId) ?? [];
    existing.push({
      emoji: row.emoji,
      count: row.count,
      hasReacted: row.hasReacted,
    });
    map.set(row.commentId, existing);
  }
  return map;
}

export async function toggleChangelogCommentReaction(
  commentId: string,
  emoji: string,
  userId: string
): Promise<{ added: boolean }> {
  if (!(REACTION_EMOJIS as readonly string[]).includes(emoji)) {
    throw new Error("Invalid emoji.");
  }

  const existing = await db
    .select({ id: changelogCommentReactions.id })
    .from(changelogCommentReactions)
    .where(
      and(
        eq(changelogCommentReactions.commentId, commentId),
        eq(changelogCommentReactions.userId, userId),
        eq(changelogCommentReactions.emoji, emoji)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .delete(changelogCommentReactions)
      .where(eq(changelogCommentReactions.id, existing[0]!.id));
    return { added: false };
  }

  const id = (await import("@paralleldrive/cuid2")).createId();
  await db
    .insert(changelogCommentReactions)
    .values({ id, commentId, userId, emoji });
  return { added: true };
}
