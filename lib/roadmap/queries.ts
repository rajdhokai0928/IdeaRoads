import { and, desc, eq, ilike, inArray, isNull, sql } from "drizzle-orm";
import { boards, categories, posts, votes } from "@/db/schema";
import { db } from "@/lib/db";

export const ROADMAP_STATUSES = [
  "planned",
  "in_progress",
  "completed",
] as const;
export type RoadmapStatus = (typeof ROADMAP_STATUSES)[number];

export interface RoadmapPost {
  boardId: string;
  boardName: string;
  boardSlug: string;
  categoryColor: string | null;
  categoryId: string | null;
  categoryName: string | null;
  commentCount: number;
  createdAt: Date;
  hasVoted: boolean;
  id: string;
  isPinned: boolean;
  slug: string;
  status: string;
  title: string;
  updatedAt: Date;
  upvotes: number;
}

export interface RoadmapData {
  completed: RoadmapPost[];
  in_progress: RoadmapPost[];
  planned: RoadmapPost[];
}

export type RoadmapSort = "votes" | "latest_status_change";

export async function listPostsForRoadmap(
  workspaceId: string,
  opts: {
    isAdmin?: boolean;
    userId?: string;
    search?: string;
    categoryId?: string;
    sort?: RoadmapSort;
  } = {}
): Promise<RoadmapData> {
  const { isAdmin = false, userId, search, categoryId, sort = "votes" } = opts;

  const conditions = [
    eq(posts.workspaceId, workspaceId),
    inArray(posts.status, [...ROADMAP_STATUSES]),
    // Merged posts leave active lists, including the roadmap.
    isNull(posts.mergedIntoId),
    // Unpublished drafts never appear on the roadmap (admin or public view).
    eq(posts.isDraft, false),
  ];

  // Public view excludes private and archived boards
  if (!isAdmin) {
    conditions.push(eq(boards.isPublic, true));
  }
  conditions.push(eq(boards.isArchived, false));

  if (categoryId) {
    conditions.push(eq(posts.categoryId, categoryId));
  }
  if (search?.trim()) {
    conditions.push(ilike(posts.title, `%${search.trim()}%`));
  }

  const orderByCols =
    sort === "latest_status_change"
      ? [desc(posts.isPinned), desc(posts.updatedAt)]
      : [desc(posts.isPinned), desc(posts.upvotes)];

  let rows: RoadmapPost[];

  if (userId) {
    const userVoteAlias = db
      .select({ postId: votes.postId, id: votes.id })
      .from(votes)
      .where(eq(votes.userId, userId))
      .as("user_vote");

    rows = await db
      .select({
        id: posts.id,
        slug: posts.slug,
        title: posts.title,
        status: posts.status,
        upvotes: posts.upvotes,
        commentCount: posts.commentCount,
        isPinned: posts.isPinned,
        hasVoted: sql<boolean>`${userVoteAlias.id} IS NOT NULL`,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        boardId: boards.id,
        boardSlug: boards.slug,
        boardName: boards.name,
        categoryId: posts.categoryId,
        categoryName: categories.name,
        categoryColor: categories.color,
      })
      .from(posts)
      .innerJoin(boards, eq(posts.boardId, boards.id))
      .leftJoin(categories, eq(posts.categoryId, categories.id))
      .leftJoin(userVoteAlias, eq(posts.id, userVoteAlias.postId))
      .where(and(...conditions))
      .orderBy(...orderByCols);
  } else {
    rows = await db
      .select({
        id: posts.id,
        slug: posts.slug,
        title: posts.title,
        status: posts.status,
        upvotes: posts.upvotes,
        commentCount: posts.commentCount,
        isPinned: posts.isPinned,
        hasVoted: sql<boolean>`false`,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        boardId: boards.id,
        boardSlug: boards.slug,
        boardName: boards.name,
        categoryId: posts.categoryId,
        categoryName: categories.name,
        categoryColor: categories.color,
      })
      .from(posts)
      .innerJoin(boards, eq(posts.boardId, boards.id))
      .leftJoin(categories, eq(posts.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(...orderByCols);
  }

  return {
    planned: rows.filter((r) => r.status === "planned"),
    in_progress: rows.filter((r) => r.status === "in_progress"),
    completed: rows.filter((r) => r.status === "completed"),
  };
}
