import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostsPagination } from "@/components/posts/posts-pagination";
import { PostsTable } from "@/components/posts/posts-table";
import { PageHeader } from "@/components/ui/page";
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
    draft?: string;
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
  const {
    category,
    draft,
    new: newParam,
    page,
    q,
    sort,
    status,
  } = await searchParams;
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

  const validSort: "newest" | "top" = sort === "top" ? "top" : "newest";
  const validStatus = status ?? "";
  const validCategoryId = category ?? "";
  const searchQuery = q ?? "";
  const currentPage = Math.max(1, Number(page ?? 1));
  // Draft filter: "only" shows drafts, "published" hides them, default shows all
  // (published + drafts, so authors never lose track of a saved draft).
  const validDraft: "all" | "only" | "published" =
    draft === "only" ? "only" : draft === "published" ? "published" : "all";
  const draftsOpt: "include" | "only" | "exclude" =
    validDraft === "only"
      ? "only"
      : validDraft === "published"
        ? "exclude"
        : "include";

  const filterOpts = {
    sort: validSort,
    status: validStatus || undefined,
    categoryId: validCategoryId || undefined,
    search: searchQuery || undefined,
    includeUnapproved: true,
    drafts: draftsOpt,
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

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const rangeStart = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, totalCount);

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
    if (validDraft !== "all") {
      params.set("draft", validDraft);
    }
    if (targetPage > 1) {
      params.set("page", String(targetPage));
    }
    const qs = params.toString();
    return `/${slug}/feedback${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        actions={
          board ? (
            <AddFeedbackDialog
              boardId={board.id}
              categories={categories}
              defaultOpen={newParam === "1"}
              workspaceId={workspace.id}
              workspaceSlug={slug}
              workspaceStatuses={workspaceStatuses}
            />
          ) : undefined
        }
        description={`Every piece of feedback in ${workspace.name}.`}
        title="All Feedback"
      />

      <FeedbackFilters
        activeCategoryId={validCategoryId}
        activeDraft={validDraft}
        activeSearch={searchQuery}
        activeSort={validSort}
        activeStatus={validStatus}
        categories={categories}
        workspaceStatuses={workspaceStatuses}
      />

      <PostsTable
        categories={categories}
        enableBulkActions
        isAdminOrOwner={isAdminOrOwner}
        isMember={true}
        isSignedIn={true}
        postHref={(post) => `/${slug}/feedback/${post.id}`}
        posts={posts}
        workspaceId={workspace.id}
        workspaceStatuses={workspaceStatuses}
      />

      {totalPages > 1 && (
        <div className="flex flex-col-reverse items-center justify-between gap-3 border-t border-ir-border px-4 py-3 sm:flex-row sm:px-8">
          <span className="text-xs text-ir-muted">
            Showing {rangeStart.toLocaleString()}–{rangeEnd.toLocaleString()} of{" "}
            {totalCount.toLocaleString()}
          </span>
          <PostsPagination
            currentPage={currentPage}
            hrefForPage={pageHref}
            totalPages={totalPages}
          />
        </div>
      )}
    </div>
  );
}
