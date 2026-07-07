import { PostRow } from "@/components/posts/post-row";

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
  isDraft: boolean;
  isPinned: boolean;
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
  id: string;
  isArchived: boolean;
  name: string;
  slug: string;
}

interface PostsTableProps {
  categories: Category[];
  isAdminOrOwner: boolean;
  isMember: boolean;
  isSignedIn: boolean;
  // Builds the link target for a post row — differs between the admin
  // (workspace-shelled) and public post-detail routes, which are genuinely
  // separate pages so members never get redirected out of their admin shell.
  postHref: (post: PostsTableRow) => string;
  posts: PostsTableRow[];
  showBoardColumn?: boolean;
  workspaceId: string;
  workspaceStatuses: WorkspaceStatus[];
}

export function PostsTable({
  posts,
  categories,
  workspaceStatuses,
  postHref,
  isSignedIn,
  isAdminOrOwner,
  isMember,
  workspaceId,
  showBoardColumn = true,
}: PostsTableProps) {
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
            {isMember && (
              <th className="w-12 px-4 py-2.5 text-left text-2xs font-semibold uppercase tracking-eyebrow text-muted-foreground">
                <span className="sr-only">Actions</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {posts.map((post) => (
            <PostRow
              categories={categories}
              href={postHref(post)}
              isAdminOrOwner={isAdminOrOwner}
              isMember={isMember}
              isSignedIn={isSignedIn}
              key={post.id}
              post={post}
              showBoardColumn={showBoardColumn}
              workspaceId={workspaceId}
              workspaceStatuses={workspaceStatuses}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
