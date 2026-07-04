import { format } from "date-fns";
import { ArrowLeft, GitMerge } from "lucide-react";
import Link from "next/link";
import CommentSection from "@/components/comments/comment-section";
import CategorySelect from "@/components/posts/category-select";
import DeletePostButton from "@/components/posts/delete-post-button";
import EditPostButton from "@/components/posts/edit-post-button";
import MergePostButton from "@/components/posts/merge-post-button";
import MovePostButton from "@/components/posts/move-post-button";
import PinButton from "@/components/posts/pin-button";
import StatusSelect from "@/components/posts/status-select";
import VoterListButton from "@/components/posts/voter-list-button";
import VoteButton from "@/components/voting/vote-button";

interface Category {
  color: string;
  id: string;
  name: string;
}

interface WorkspaceStatus {
  color: string;
  id: string;
  isArchived: boolean;
  name: string;
  slug: string;
}

interface StatusHistoryEntry {
  changedByName: string | null;
  createdAt: Date;
  fromStatus: string | null;
  id: string;
  toStatus: string;
}

interface MoveTarget {
  id: string;
  name: string;
  slug: string;
}

interface PostDetailPost {
  authorEmail: string;
  authorId: string | null;
  authorName: string | null;
  boardId: string;
  body: string | null;
  categoryId: string | null;
  createdAt: Date;
  id: string;
  isLocked: boolean;
  isPinned: boolean;
  mergedIntoId: string | null;
  slug: string;
  status: string;
  title: string;
  updatedAt: Date;
  upvotes: number;
}

interface PostDetailContentProps {
  backLabel: string;
  boardHref: string;
  boardIsArchived: boolean;
  categories: Category[];
  currentUserId: string | null;
  embedQuery?: string;
  isAdminOrOwner: boolean;
  isEmbed?: boolean;
  isMember: boolean;
  isSignedIn: boolean;
  mergedTarget: { href: string; title: string } | null;
  moveTargets: MoveTarget[];
  post: PostDetailPost;
  statusHistory: StatusHistoryEntry[];
  votedByUser: boolean;
  workspaceId: string;
  workspaceSlug: string;
  workspaceStatuses: WorkspaceStatus[];
}

// Shared content for a single feedback post — everything below the shell
// (PortalHeader for the public route, the admin sidebar layout for the
// workspace route). Both `(public)/[slug]/b/[boardSlug]/p/[postSlug]` and
// `(workspace)/[slug]/feedback/[postId]` render this with the same data,
// differing only in boardHref/backLabel and embed support.
export function PostDetailContent({
  post,
  boardHref,
  backLabel,
  boardIsArchived,
  isEmbed = false,
  isSignedIn,
  isMember,
  isAdminOrOwner,
  votedByUser,
  workspaceStatuses,
  categories,
  statusHistory,
  moveTargets,
  mergedTarget,
  workspaceId,
  workspaceSlug,
  currentUserId,
}: PostDetailContentProps) {
  const isAuthor = !!currentUserId && post.authorId === currentUserId;
  const statusMap = new Map(workspaceStatuses.map((s) => [s.slug, s.name]));

  return (
    <div className="max-w-5xl mx-auto flex flex-col">
      {/* Back nav — hidden in embed mode (no navigation chrome) */}
      {!isEmbed && (
        <div className="border-b border-border px-4 py-4 sm:px-8">
          <Link
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            href={boardHref}
          >
            <ArrowLeft className="size-4" />
            {backLabel}
          </Link>
        </div>
      )}

      <div className="px-4 py-8 max-w-3xl sm:px-8">
        {/* Post header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-foreground leading-snug">
              {post.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <StatusSelect
                canEdit={isMember}
                currentStatus={post.status}
                postId={post.id}
                workspaceId={workspaceId}
                workspaceStatuses={workspaceStatuses}
              />
              <CategorySelect
                canEdit={isMember}
                categories={categories}
                currentCategoryId={post.categoryId}
                postId={post.id}
                workspaceId={workspaceId}
              />
              <span className="text-xs text-muted-foreground">
                by {post.authorName ?? post.authorEmail}
              </span>
              <span className="text-xs text-muted-foreground">
                {format(post.createdAt, "MMM d, yyyy")}
              </span>
              {post.updatedAt > post.createdAt && (
                <span className="text-xs text-muted-foreground/60">
                  edited {format(post.updatedAt, "MMM d, yyyy")}
                </span>
              )}
            </div>
          </div>

          {/* Vote button + voter list */}
          <div className="shrink-0 flex flex-col items-center gap-2">
            <VoteButton
              initialCount={post.upvotes}
              initialHasVoted={votedByUser}
              isArchived={boardIsArchived}
              isLocked={post.isLocked}
              isSignedIn={isSignedIn}
              postId={post.id}
            />
            {isMember && (
              <VoterListButton postId={post.id} voteCount={post.upvotes} />
            )}
          </div>
        </div>

        {/* Merged notice */}
        {mergedTarget && (
          <div className="mt-4 flex items-center gap-2 border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            <GitMerge className="size-4 shrink-0" />
            <span>
              Merged into{" "}
              <Link
                className="font-medium text-foreground hover:underline"
                href={mergedTarget.href}
              >
                {mergedTarget.title}
              </Link>
            </span>
          </div>
        )}

        {/* Post body */}
        {post.body && (
          <div className="mt-6 border-t border-border pt-6">
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {post.body}
            </p>
          </div>
        )}

        {/* Triage / clean-up actions (workspace members) and author delete */}
        {(isMember || isAuthor) && (
          <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-border pt-4">
            {isMember && (
              <PinButton
                isPinned={post.isPinned}
                postId={post.id}
                workspaceId={workspaceId}
              />
            )}
            {isMember && !post.mergedIntoId && (
              <>
                <MovePostButton
                  boards={moveTargets}
                  currentBoardId={post.boardId}
                  postId={post.id}
                  workspaceId={workspaceId}
                  workspaceSlug={workspaceSlug}
                />
                <MergePostButton
                  postId={post.id}
                  postTitle={post.title}
                  workspaceId={workspaceId}
                />
              </>
            )}
            {(isAuthor || isAdminOrOwner) && (
              <EditPostButton
                initialBody={post.body}
                initialTitle={post.title}
                postId={post.id}
                workspaceId={workspaceId}
              />
            )}
            <DeletePostButton
              boardHref={boardHref}
              postId={post.id}
              workspaceId={workspaceId}
            />
          </div>
        )}

        {/* Status history */}
        {statusHistory.length > 0 && (
          <div className="mt-6 border-t border-border pt-6">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Status history
            </h2>
            <ul className="space-y-2">
              {statusHistory.map((entry) => (
                <li
                  className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground"
                  key={entry.id}
                >
                  <span className="text-foreground">
                    {entry.fromStatus
                      ? `${statusMap.get(entry.fromStatus) ?? entry.fromStatus} → `
                      : ""}
                    {statusMap.get(entry.toStatus) ?? entry.toStatus}
                  </span>
                  <span>·</span>
                  <time dateTime={entry.createdAt.toISOString()}>
                    {format(entry.createdAt, "MMM d, yyyy")}
                  </time>
                  {isMember && entry.changedByName && (
                    <>
                      <span>·</span>
                      <span>by {entry.changedByName}</span>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Comments */}
        <div className="mt-6 border-t border-border pt-6">
          <CommentSection
            canModerate={isAdminOrOwner}
            currentUserId={currentUserId}
            isLocked={post.isLocked}
            isSignedIn={isSignedIn}
            postId={post.id}
          />
        </div>
      </div>
    </div>
  );
}
