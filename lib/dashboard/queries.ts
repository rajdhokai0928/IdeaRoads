import { and, desc, eq, gte, lt } from "drizzle-orm";
import { boards, comments, posts, votes } from "@/db/schema";
import { db } from "@/lib/db";

export type BreakdownPeriod = "7d" | "30d" | "all";

const PERIOD_DAYS: Record<Exclude<BreakdownPeriod, "all">, number> = {
  "7d": 7,
  "30d": 30,
};

interface DateRange {
  from: Date;
  to: Date;
}

interface BreakdownCounts {
  activeUsers: number;
  newComments: number;
  newFeedback: number;
  totalUpvotes: number;
}

export interface BreakdownMetrics extends BreakdownCounts {
  previous: BreakdownCounts | null;
}

/**
 * Current-period counts, plus the immediately preceding period of equal
 * length for a % change comparison. "All time" has no prior period to
 * compare against, so `previous` is null and callers should hide the delta.
 */
export async function getBreakdownMetrics(
  workspaceId: string,
  period: BreakdownPeriod,
  now: Date
): Promise<BreakdownMetrics> {
  if (period === "all") {
    const current = await computeBreakdownCounts(workspaceId, null);
    return { ...current, previous: null };
  }

  const days = PERIOD_DAYS[period];
  const dayMs = 86_400_000;
  const [current, previous] = await Promise.all([
    computeBreakdownCounts(workspaceId, {
      from: new Date(now.getTime() - days * dayMs),
      to: now,
    }),
    computeBreakdownCounts(workspaceId, {
      from: new Date(now.getTime() - days * 2 * dayMs),
      to: new Date(now.getTime() - days * dayMs),
    }),
  ]);
  return { ...current, previous };
}

async function computeBreakdownCounts(
  workspaceId: string,
  range: DateRange | null
): Promise<BreakdownCounts> {
  const postConditions = [eq(posts.workspaceId, workspaceId)];
  const voteConditions = [eq(votes.workspaceId, workspaceId)];
  if (range) {
    postConditions.push(
      gte(posts.createdAt, range.from),
      lt(posts.createdAt, range.to)
    );
    voteConditions.push(
      gte(votes.createdAt, range.from),
      lt(votes.createdAt, range.to)
    );
  }

  const commentConditions = [eq(posts.workspaceId, workspaceId)];
  if (range) {
    commentConditions.push(
      gte(comments.createdAt, range.from),
      lt(comments.createdAt, range.to)
    );
  }

  const [postRows, voteRows, commentRows] = await Promise.all([
    db
      .select({ authorId: posts.authorId })
      .from(posts)
      .where(and(...postConditions)),
    db
      .select({ userId: votes.userId })
      .from(votes)
      .where(and(...voteConditions)),
    db
      .select({ authorId: comments.authorId })
      .from(comments)
      .innerJoin(posts, eq(comments.postId, posts.id))
      .where(and(...commentConditions)),
  ]);

  const activeUserIds = new Set<string>();
  for (const row of postRows) {
    if (row.authorId) {
      activeUserIds.add(row.authorId);
    }
  }
  for (const row of voteRows) {
    if (row.userId) {
      activeUserIds.add(row.userId);
    }
  }
  for (const row of commentRows) {
    if (row.authorId) {
      activeUserIds.add(row.authorId);
    }
  }

  return {
    newFeedback: postRows.length,
    totalUpvotes: voteRows.length,
    newComments: commentRows.length,
    activeUsers: activeUserIds.size,
  };
}

export type ActivityType = "all" | "post" | "comment" | "vote";

export interface ActivityItem {
  authorName: string | null;
  boardName: string;
  boardSlug: string;
  createdAt: Date;
  id: string;
  postId: string;
  postSlug: string;
  postTitle: string;
  type: "post" | "comment" | "vote";
}

/** Recent posts/comments/votes across the workspace, merged and sorted newest first. */
export async function getRecentActivity(
  workspaceId: string,
  opts: { limit?: number; type?: ActivityType } = {}
): Promise<ActivityItem[]> {
  const { limit = 10, type = "all" } = opts;

  const [postItems, commentItems, voteItems] = await Promise.all([
    type === "all" || type === "post"
      ? db
          .select({
            id: posts.id,
            createdAt: posts.createdAt,
            authorName: posts.authorName,
            postId: posts.id,
            postSlug: posts.slug,
            postTitle: posts.title,
            boardSlug: boards.slug,
            boardName: boards.name,
          })
          .from(posts)
          .innerJoin(boards, eq(posts.boardId, boards.id))
          .where(eq(posts.workspaceId, workspaceId))
          .orderBy(desc(posts.createdAt))
          .limit(limit)
      : Promise.resolve([]),
    type === "all" || type === "comment"
      ? db
          .select({
            id: comments.id,
            createdAt: comments.createdAt,
            authorName: comments.authorName,
            postId: posts.id,
            postSlug: posts.slug,
            postTitle: posts.title,
            boardSlug: boards.slug,
            boardName: boards.name,
          })
          .from(comments)
          .innerJoin(posts, eq(comments.postId, posts.id))
          .innerJoin(boards, eq(posts.boardId, boards.id))
          .where(
            and(
              eq(posts.workspaceId, workspaceId),
              eq(comments.isDeleted, false)
            )
          )
          .orderBy(desc(comments.createdAt))
          .limit(limit)
      : Promise.resolve([]),
    type === "all" || type === "vote"
      ? db
          .select({
            id: votes.id,
            createdAt: votes.createdAt,
            authorName: votes.userName,
            postId: posts.id,
            postSlug: posts.slug,
            postTitle: posts.title,
            boardSlug: boards.slug,
            boardName: boards.name,
          })
          .from(votes)
          .innerJoin(posts, eq(votes.postId, posts.id))
          .innerJoin(boards, eq(posts.boardId, boards.id))
          .where(eq(votes.workspaceId, workspaceId))
          .orderBy(desc(votes.createdAt))
          .limit(limit)
      : Promise.resolve([]),
  ]);

  const merged: ActivityItem[] = [
    ...postItems.map((row) => ({ ...row, type: "post" as const })),
    ...commentItems.map((row) => ({ ...row, type: "comment" as const })),
    ...voteItems.map((row) => ({ ...row, type: "vote" as const })),
  ];

  merged.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return merged.slice(0, limit);
}
