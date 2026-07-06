import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Pin } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryChip } from "@/components/categories/category-chip";
import { EmbedResizeReporter } from "@/components/embed/resize-reporter";
import { CategorySidebar } from "@/components/portal/category-sidebar";
import { PoweredByBadge } from "@/components/portal/powered-by-badge";
import { PostStatusBadge } from "@/components/posts/post-status-badge";
import VoteButton from "@/components/voting/vote-button";
import { PortalHeader } from "@/components/workspace/portal-header";
import { getCurrentSession } from "@/lib/authz";
import { getBoardBySlug, listBoardsForWorkspace } from "@/lib/boards/queries";
import { getActiveCategoriesForWorkspace } from "@/lib/categories/queries";
import {
  buildEmbedQuery,
  embedWrapperProps,
  parseEmbedParams,
} from "@/lib/embed/style";
import { listBoardPosts } from "@/lib/posts/queries";
import { getActiveWorkspaceStatuses } from "@/lib/workspace-statuses/queries";
import {
  getWorkspaceBySlug,
  getWorkspaceMember,
} from "@/lib/workspaces/queries";
import BoardFilters from "./_components/board-filters";

interface Props {
  params: Promise<{ slug: string; boardSlug: string }>;
  searchParams: Promise<{
    sort?: string;
    status?: string;
    category?: string;
    q?: string;
    myVotes?: string;
    mine?: string;
    embed?: string;
    theme?: string;
    accentColor?: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, boardSlug } = await params;
  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) {
    return { title: "Board" };
  }
  const board = await getBoardBySlug(workspace.id, boardSlug);
  return { title: board?.name ?? "Board" };
}

export default async function BoardPage({ params, searchParams }: Props) {
  const { slug, boardSlug } = await params;
  const {
    sort,
    status,
    category,
    q,
    myVotes,
    mine,
    embed,
    theme,
    accentColor,
  } = await searchParams;
  const embedParams = parseEmbedParams({ embed, theme, accentColor });
  const { isEmbed } = embedParams;
  const embedQuery = buildEmbedQuery(embedParams);
  const embedWrapper = embedWrapperProps(embedParams);

  const session = await getCurrentSession();

  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) {
    notFound();
  }

  const member = session
    ? await getWorkspaceMember(workspace.id, session.user.id)
    : null;
  const isSignedIn = !!session;
  const isMember = !!member;

  const board = await getBoardBySlug(workspace.id, boardSlug);
  if (!board) {
    notFound();
  }

  // Private boards are visible to workspace members only. Archived boards stay
  // publicly readable (read-only) — they show a notice and don't accept new
  // feedback (see below).
  if (!board.isPublic && !isMember) {
    notFound();
  }

  const validSort =
    sort === "top" ? "top" : sort === "trending" ? "trending" : "newest";
  const validStatus = status ?? "";
  const validCategoryId = category ?? "";
  const searchQuery = q ?? "";
  const myVotesActive = isSignedIn && myVotes === "true";
  const mineActive = isSignedIn && mine === "1";

  const [boardPosts, workspaceStatuses, categories, allBoards] =
    await Promise.all([
      listBoardPosts(board.id, {
        sort: validSort,
        status: validStatus || undefined,
        categoryId: validCategoryId || undefined,
        search: searchQuery || undefined,
        userId: session?.user.id,
        myVotes: myVotesActive,
        onlyMine: mineActive,
        // Team (Brand Admin + Team Member) sees moderation-held posts; the public
        // sees approved feedback only.
        includeUnapproved: isMember,
      }),
      getActiveWorkspaceStatuses(workspace.id),
      getActiveCategoriesForWorkspace(workspace.id),
      listBoardsForWorkspace(workspace.id),
    ]);

  // Build a category map for quick lookup
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const publicBoards = allBoards.filter((b) => b.isPublic && !b.isArchived);

  const newPostHref = board.isArchived
    ? undefined
    : isSignedIn
      ? `/${slug}/b/${boardSlug}/new${embedQuery}`
      : `/signin?next=${encodeURIComponent(`/${slug}/b/${boardSlug}/new${embedQuery}`)}`;

  return (
    <div
      className={`min-h-screen bg-background ${embedWrapper.className}`}
      style={embedWrapper.style}
    >
      {isEmbed && <EmbedResizeReporter />}
      {!isEmbed && (
        <PortalHeader
          boards={publicBoards}
          changelogPublic={workspace.changelogPublic}
          currentPath={`/${slug}/b/${boardSlug}${embedQuery}`}
          isMember={isMember}
          isSignedIn={isSignedIn}
          logoUrl={workspace.logoUrl}
          roadmapPublic={workspace.roadmapPublic}
          slug={slug}
          userEmail={session?.user.email}
          userImage={session?.user.image}
          userName={session?.user.name}
          workspaceName={workspace.name}
        />
      )}
      {!isEmbed && <PoweredByBadge />}

      <div className="max-w-5xl mx-auto flex flex-col">
        {/* Page header */}
        <div className="border-b border-border px-4 py-6 sm:px-8">
          <h1 className="text-xl font-semibold text-foreground">
            {board.name}
          </h1>
          {board.description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {board.description}
            </p>
          )}
          {board.isArchived && (
            <p className="mt-3 text-xs text-muted-foreground border-l-2 border-border pl-3">
              This board is archived and no longer accepting new feedback. Its
              posts remain readable below.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-6 px-4 py-6 sm:px-8 lg:flex-row lg:items-start lg:gap-8">
          {/* Main content */}
          <div className="min-w-0 flex-1 border border-border">
            <BoardFilters
              activeSearch={searchQuery}
              activeSort={validSort}
              activeStatus={validStatus}
              myVotesActive={myVotesActive}
              showMyVotes={isSignedIn}
              workspaceStatuses={workspaceStatuses}
            />

            {/* Post list */}
            {boardPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-24 text-center sm:px-8">
                {searchQuery ||
                validStatus ||
                validCategoryId ||
                myVotesActive ||
                mineActive ? (
                  <>
                    <p className="text-sm font-medium text-foreground">
                      No posts match your filters
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Try a different search term, status, or category.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-foreground">
                      No feedback yet
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Be the first to submit an idea or request.
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {boardPosts.map((post) => {
                  const postCategory = post.categoryId
                    ? categoryMap.get(post.categoryId)
                    : undefined;

                  return (
                    <div
                      className="group flex items-start gap-3 px-4 py-5 hover:bg-muted/40 transition-colors duration-150 sm:px-6"
                      key={post.id}
                    >
                      {/* Post content */}
                      <Link
                        className="min-w-0 flex-1"
                        href={`/${slug}/b/${boardSlug}/p/${post.slug}${embedQuery}`}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          {post.isPinned && (
                            <Pin className="size-3 shrink-0 text-muted-foreground" />
                          )}
                          <p className="text-sm font-medium text-foreground transition-colors group-hover:text-foreground/80">
                            {post.title}
                          </p>
                        </div>
                        {post.body && (
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {post.body}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                          {postCategory && (
                            <CategoryChip
                              color={postCategory.color}
                              name={postCategory.name}
                              size="xs"
                            />
                          )}
                          <PostStatusBadge
                            status={post.status}
                            workspaceStatuses={workspaceStatuses}
                          />
                          <span className="text-xs text-muted-foreground">
                            {post.authorName ?? post.authorEmail} ·{" "}
                            {formatDistanceToNow(post.createdAt, {
                              addSuffix: true,
                            })}
                          </span>
                          {post.commentCount > 0 && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MessageSquare className="size-3" />
                              {post.commentCount}
                            </span>
                          )}
                        </div>
                      </Link>

                      {/* Vote control */}
                      <div className="shrink-0">
                        <VoteButton
                          compact
                          initialCount={post.upvotes}
                          initialHasVoted={post.hasVoted}
                          isArchived={board.isArchived}
                          isLocked={false}
                          isSignedIn={isSignedIn}
                          postId={post.id}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <CategorySidebar
            activeCategoryId={validCategoryId}
            activeSearch={searchQuery}
            activeSort={validSort}
            activeStatus={validStatus}
            boardSlug={boardSlug}
            categories={categories}
            isMine={mineActive}
            isSignedIn={isSignedIn}
            newPostHref={newPostHref}
            slug={slug}
          />
        </div>
      </div>
    </div>
  );
}
