import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostsTable } from "@/components/posts/posts-table";
import { WORKSPACE_MEMBER } from "@/config/platform";
import { requireSession } from "@/lib/authz";
import { getWorkspaceBoard } from "@/lib/boards/queries";
import { getActiveCategoriesForWorkspace } from "@/lib/categories/queries";
import {
  countWorkspacePostsFiltered,
  listWorkspacePosts,
} from "@/lib/posts/queries";
import { getActiveWorkspaceStatuses } from "@/lib/workspace-statuses/queries";
import {
  getWorkspaceBySlug,
  getWorkspaceMember,
} from "@/lib/workspaces/queries";
import { AddFeedbackDialog } from "./_components/add-feedback-dialog";
import { FeedbackFilters } from "./_components/feedback-filters";

const PAGE_SIZE = 20;

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    category?: string;
    new?: string;
    page?: string;
    q?: string;
    sort?: string;
    status?: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Feedback — ${slug}` };
}

export default async function FeedbackPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { category, new: newParam, page, q, sort, status } = await searchParams;
  const session = await requireSession();

  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) {
    notFound();
  }

  const member = await getWorkspaceMember(workspace.id, session.user.id);
  if (!member) {
    notFound();
  }
  const isAdminOrOwner = member.role !== WORKSPACE_MEMBER;

  const validSort: "newest" | "top" | "trending" =
    sort === "top" ? "top" : sort === "trending" ? "trending" : "newest";
  const validStatus = status ?? "";
  const validCategoryId = category ?? "";
  const searchQuery = q ?? "";
  const currentPage = Math.max(1, Number(page ?? 1));

  const filterOpts = {
    sort: validSort,
    status: validStatus || undefined,
    categoryId: validCategoryId || undefined,
    search: searchQuery || undefined,
    includeUnapproved: true,
  };

  const [posts, totalCount, board, categories, workspaceStatuses] =
    await Promise.all([
      listWorkspacePosts(workspace.id, {
        ...filterOpts,
        userId: session.user.id,
        limit: PAGE_SIZE,
        offset: (currentPage - 1) * PAGE_SIZE,
      }),
      countWorkspacePostsFiltered(workspace.id, filterOpts),
      getWorkspaceBoard(workspace.id),
      getActiveCategoriesForWorkspace(workspace.id),
      getActiveWorkspaceStatuses(workspace.id),
    ]);

  const hasMore = currentPage * PAGE_SIZE < totalCount;

  function pageHref(targetPage: number) {
    const params = new URLSearchParams();
    if (validSort !== "newest") {
      params.set("sort", validSort);
    }
    if (validStatus) {
      params.set("status", validStatus);
    }
    if (validCategoryId) {
      params.set("category", validCategoryId);
    }
    if (searchQuery) {
      params.set("q", searchQuery);
    }
    if (targetPage > 1) {
      params.set("page", String(targetPage));
    }
    const qs = params.toString();
    return `/${slug}/feedback${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-4 py-6 sm:px-8">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            All Feedback
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every piece of feedback in {workspace.name}.
          </p>
        </div>
        {board && (
          <AddFeedbackDialog
            boardId={board.id}
            categories={categories}
            defaultOpen={newParam === "1"}
            workspaceId={workspace.id}
            workspaceSlug={slug}
            workspaceStatuses={workspaceStatuses}
          />
        )}
      </div>

      <FeedbackFilters
        activeCategoryId={validCategoryId}
        activeSearch={searchQuery}
        activeSort={validSort}
        activeStatus={validStatus}
        categories={categories}
        workspaceStatuses={workspaceStatuses}
      />

      <PostsTable
        categories={categories}
        isAdminOrOwner={isAdminOrOwner}
        isMember={true}
        isSignedIn={true}
        postHref={(post) => `/${slug}/feedback/${post.id}`}
        posts={posts}
        workspaceId={workspace.id}
        workspaceStatuses={workspaceStatuses}
      />

      {(currentPage > 1 || hasMore) && (
        <div className="flex items-center justify-between gap-4 border-t border-border px-4 py-3 sm:px-8">
          <span className="text-xs text-muted-foreground">
            Page {currentPage} · {totalCount.toLocaleString()} total
          </span>
          <div className="flex items-center gap-2">
            {currentPage > 1 && (
              <Link
                className="px-3 py-1.5 text-xs border border-border hover:bg-muted transition-colors duration-150"
                href={pageHref(currentPage - 1)}
              >
                Previous
              </Link>
            )}
            {hasMore && (
              <Link
                className="px-3 py-1.5 text-xs border border-border hover:bg-muted transition-colors duration-150"
                href={pageHref(currentPage + 1)}
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
