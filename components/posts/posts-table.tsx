import { formatDistanceToNow } from "date-fns";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { CategoryChip } from "@/components/categories/category-chip";
import { PostStatusBadge } from "@/components/posts/post-status-badge";
import VoteButton from "@/components/voting/vote-button";

export interface PostsTableRow {
  authorEmail: string;
  authorName: string | null;
  boardIsPublic: boolean;
  boardName: string;
  boardSlug: string;
  body: string | null;
  categoryId: string | null;
  createdAt: Date;
  hasVoted: boolean;
  id: string;
  isApproved: boolean;
  slug: string;
  status: string;
  title: string;
  upvotes: number;
}

interface Category {
  color: string;
  id: string;
  name: string;
}

interface WorkspaceStatus {
  color: string;
  name: string;
  slug: string;
}

interface PostsTableProps {
  categories: Category[];
  isSignedIn: boolean;
  // Builds the link target for a post row — differs between the admin
  // (workspace-shelled) and public post-detail routes, which are genuinely
  // separate pages so members never get redirected out of their admin shell.
  postHref: (post: PostsTableRow) => string;
  posts: PostsTableRow[];
  showBoardColumn?: boolean;
  workspaceStatuses: WorkspaceStatus[];
}

export function PostsTable({
  posts,
  categories,
  workspaceStatuses,
  postHref,
  isSignedIn,
  showBoardColumn = true,
}: PostsTableProps) {
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
        <p className="text-sm font-medium text-foreground">No feedback yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Submitted feedback will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="w-16 px-4 py-2.5 text-left text-2xs font-semibold uppercase tracking-eyebrow text-muted-foreground">
              Votes
            </th>
            <th className="px-4 py-2.5 text-left text-2xs font-semibold uppercase tracking-eyebrow text-muted-foreground">
              Title
            </th>
            <th className="hidden px-4 py-2.5 text-left text-2xs font-semibold uppercase tracking-eyebrow text-muted-foreground lg:table-cell">
              Description
            </th>
            <th className="hidden px-4 py-2.5 text-left text-2xs font-semibold uppercase tracking-eyebrow text-muted-foreground sm:table-cell">
              Author
            </th>
            <th className="hidden px-4 py-2.5 text-left text-2xs font-semibold uppercase tracking-eyebrow text-muted-foreground sm:table-cell">
              Created
            </th>
            <th className="hidden px-4 py-2.5 text-left text-2xs font-semibold uppercase tracking-eyebrow text-muted-foreground md:table-cell">
              Category
            </th>
            <th className="px-4 py-2.5 text-left text-2xs font-semibold uppercase tracking-eyebrow text-muted-foreground">
              Status
            </th>
            <th className="px-4 py-2.5 text-left text-2xs font-semibold uppercase tracking-eyebrow text-muted-foreground">
              Visibility
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {posts.map((post) => {
            const category = post.categoryId
              ? categoryMap.get(post.categoryId)
              : undefined;

            return (
              <tr
                className="transition-colors duration-150 hover:bg-muted/40"
                key={post.id}
              >
                <td className="px-4 py-3 align-top">
                  <VoteButton
                    initialCount={post.upvotes}
                    initialHasVoted={post.hasVoted}
                    isSignedIn={isSignedIn}
                    postId={post.id}
                  />
                </td>
                <td className="max-w-64 px-4 py-3 align-top">
                  <Link
                    className="font-medium text-foreground hover:underline focus-visible:outline-none focus-visible:underline"
                    href={postHref(post)}
                  >
                    {post.title}
                  </Link>
                  {showBoardColumn && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {post.boardName}
                    </p>
                  )}
                  {!post.isApproved && (
                    <span className="mt-1 inline-block bg-warning/10 px-1.5 py-0.5 text-2xs font-medium text-warning">
                      Pending review
                    </span>
                  )}
                </td>
                <td className="hidden max-w-72 px-4 py-3 align-top lg:table-cell">
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {post.body ?? "—"}
                  </p>
                </td>
                <td className="hidden max-w-32 px-4 py-3 align-top sm:table-cell">
                  <p className="truncate text-xs text-muted-foreground">
                    {post.authorName ?? post.authorEmail}
                  </p>
                </td>
                <td className="hidden whitespace-nowrap px-4 py-3 align-top text-xs text-muted-foreground sm:table-cell">
                  {formatDistanceToNow(post.createdAt, { addSuffix: true })}
                </td>
                <td className="hidden px-4 py-3 align-top md:table-cell">
                  {category ? (
                    <CategoryChip color={category.color} name={category.name} />
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3 align-top">
                  <PostStatusBadge
                    status={post.status}
                    workspaceStatuses={workspaceStatuses}
                  />
                </td>
                <td className="px-4 py-3 align-top">
                  {post.boardIsPublic ? (
                    <Eye
                      aria-label="Public board"
                      className="size-4 text-muted-foreground"
                    >
                      <title>Public board</title>
                    </Eye>
                  ) : (
                    <EyeOff
                      aria-label="Private board"
                      className="size-4 text-muted-foreground/50"
                    >
                      <title>Private board</title>
                    </EyeOff>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
