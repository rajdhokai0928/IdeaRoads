import { and, eq, sql } from "drizzle-orm";
import { REACTION_EMOJIS } from "@/config/platform";
import { changelogEntryReactions } from "@/db/schema";
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
