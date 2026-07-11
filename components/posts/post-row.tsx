"use client";

import { PushPinIcon } from "@phosphor-icons/react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RowCheckbox } from "@/components/posts/bulk-selection-context";
import CategorySelect from "@/components/posts/category-select";
import { PostActionsMenu } from "@/components/posts/post-actions-menu";
import type { PostsTableRow } from "@/components/posts/posts-table";
import StatusSelect from "@/components/posts/status-select";
import VisibilityToggle from "@/components/posts/visibility-toggle";
import VoteButton from "@/components/voting/vote-button";
import { truncateHtmlToText } from "@/lib/changelog/html";

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

interface PostRowProps {
  categories: Category[];
  href: string;
  isAdminOrOwner: boolean;
  isMember: boolean;
  isSignedIn: boolean;
  post: PostsTableRow;
  selectable?: boolean;
  showBoardColumn: boolean;
  workspaceId: string;
  workspaceStatuses: WorkspaceStatus[];
}

// The whole row navigates to the post on click, matching the public board
// list's pattern — only interactive controls (vote, category/status/visibility
// selects) opt out (stopPropagation) so using them doesn't also trigger
// navigation. The title keeps a real <Link> so keyboard nav, middle-click, and
// "open in new tab" still work.
export function PostRow({
  post,
  categories,
  workspaceStatuses,
  href,
  isSignedIn,
  isAdminOrOwner,
  isMember,
  workspaceId,
  selectable = false,
  showBoardColumn,
}: PostRowProps) {
  const router = useRouter();

  return (
    <tr
      className="cursor-pointer transition-colors duration-150 ease-ir-standard hover:bg-ir-muted-surface"
      onClick={() => router.push(href)}
    >
      {selectable && (
        // biome-ignore lint/a11y/noNoninteractiveElementInteractions: only fences off row-click bubbling from the checkbox inside, not a new interaction
        // biome-ignore lint/a11y/useKeyWithClickEvents: same — stopPropagation only, no new behavior to make keyboard-reachable
        <td
          className="px-4 py-3 align-top"
          onClick={(e) => e.stopPropagation()}
        >
          <RowCheckbox id={post.id} label={post.title} />
        </td>
      )}
      {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: only fences off row-click bubbling from the interactive control inside, not a new interaction */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: same — stopPropagation only, no new behavior to make keyboard-reachable */}
      <td className="px-4 py-3 align-top" onClick={(e) => e.stopPropagation()}>
        <VoteButton
          initialCount={post.upvotes}
          initialHasVoted={post.hasVoted}
          isSignedIn={isSignedIn}
          postId={post.id}
        />
      </td>
      <td className="max-w-64 px-4 py-3 align-top">
        <div className="flex min-w-0 items-center gap-2">
          {post.isPinned && (
            <span
              className="inline-flex shrink-0 items-center text-ir-primary"
              title="Pinned"
            >
              <PushPinIcon className="size-3.5" weight="fill" />
              <span className="sr-only">Pinned</span>
            </span>
          )}
          <Link
            className="min-w-0 truncate font-medium text-ir-heading transition-colors duration-150 ease-ir-standard hover:text-ir-primary hover:underline focus-visible:outline-none focus-visible:underline"
            href={href}
            title={post.title}
          >
            {post.title}
          </Link>
          {post.isDraft && (
            <span className="inline-flex shrink-0 items-center rounded-ir-full bg-ir-warning/10 px-2 py-0.5 text-[11px] font-medium text-ir-warning">
              Draft
            </span>
          )}
        </div>
        {showBoardColumn && (
          <p className="mt-0.5 truncate text-xs text-ir-muted">
            {post.boardName}
          </p>
        )}
      </td>
      <td className="hidden max-w-72 px-4 py-3 align-top lg:table-cell">
        <p className="line-clamp-2 text-xs text-ir-muted">
          {post.body ? truncateHtmlToText(post.body, 200) : "—"}
        </p>
      </td>
      <td className="hidden max-w-32 px-4 py-3 align-top sm:table-cell">
        <p className="truncate text-xs text-ir-muted">
          {post.authorName || post.authorEmail}
        </p>
      </td>
      <td className="hidden whitespace-nowrap px-4 py-3 align-top text-xs text-ir-muted sm:table-cell">
        {formatDistanceToNow(post.createdAt, { addSuffix: true })}
      </td>
      {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: only fences off row-click bubbling from the selects inside, not a new interaction */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: same — stopPropagation only, no new behavior to make keyboard-reachable */}
      <td
        className="hidden px-4 py-3 align-top md:table-cell"
        onClick={(e) => e.stopPropagation()}
      >
        <CategorySelect
          canEdit={isMember}
          categories={categories}
          currentCategoryId={post.categoryId}
          postId={post.id}
          workspaceId={workspaceId}
        />
      </td>
      {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: only fences off row-click bubbling from the selects inside, not a new interaction */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: same — stopPropagation only, no new behavior to make keyboard-reachable */}
      <td className="px-4 py-3 align-top" onClick={(e) => e.stopPropagation()}>
        <StatusSelect
          canEdit={isMember}
          currentStatus={post.status}
          isDraft={post.isDraft}
          postId={post.id}
          workspaceId={workspaceId}
          workspaceStatuses={workspaceStatuses}
        />
      </td>
      {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: only fences off row-click bubbling from the selects inside, not a new interaction */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: same — stopPropagation only, no new behavior to make keyboard-reachable */}
      <td className="px-4 py-3 align-top" onClick={(e) => e.stopPropagation()}>
        <VisibilityToggle
          canEdit={isAdminOrOwner}
          isApproved={post.isApproved}
          isDraft={post.isDraft}
          postId={post.id}
          workspaceId={workspaceId}
        />
      </td>
      {isMember && (
        // biome-ignore lint/a11y/noNoninteractiveElementInteractions: only fences off row-click bubbling from the menu inside, not a new interaction
        // biome-ignore lint/a11y/useKeyWithClickEvents: same — stopPropagation only, no new behavior to make keyboard-reachable
        <td
          className="px-4 py-3 align-top"
          onClick={(e) => e.stopPropagation()}
        >
          <PostActionsMenu
            detailHref={href}
            isDraft={post.isDraft}
            isPinned={post.isPinned}
            postId={post.id}
            postTitle={post.title}
            workspaceId={workspaceId}
          />
        </td>
      )}
    </tr>
  );
}
