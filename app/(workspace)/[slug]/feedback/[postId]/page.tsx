import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostDetailContent } from "@/components/posts/post-detail-content";
import { WORKSPACE_MEMBER } from "@/config/platform";
import { requireSession } from "@/lib/authz";
import { getBoardById } from "@/lib/boards/queries";
import { getActiveCategoriesForWorkspace } from "@/lib/categories/queries";
import { getPost, listStatusHistory } from "@/lib/posts/queries";
import { hasUserVoted } from "@/lib/voting";
import { getActiveWorkspaceStatuses } from "@/lib/workspace-statuses/queries";
import { listMembers } from "@/lib/workspaces/members";
import {
  getWorkspaceBySlug,
  getWorkspaceMember,
} from "@/lib/workspaces/queries";

interface Props {
  params: Promise<{ slug: string; postId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { postId } = await params;
  const post = await getPost(postId);
  return { title: post?.title ?? "Post" };
}

export default async function AdminPostDetailPage({ params }: Props) {
  const { slug, postId } = await params;
  const session = await requireSession();

  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) {
    notFound();
  }

  const member = await getWorkspaceMember(workspace.id, session.user.id);
  if (!member) {
    notFound();
  }

  const post = await getPost(postId);
  if (!post || post.workspaceId !== workspace.id) {
    notFound();
  }

  const board = await getBoardById(post.boardId);
  if (!board) {
    notFound();
  }

  const isAdminOrOwner = member.role !== WORKSPACE_MEMBER;

  const [votedByUser, workspaceStatuses, categories, statusHistory, members] =
    await Promise.all([
      hasUserVoted(post.id, { userId: session.user.id }),
      getActiveWorkspaceStatuses(workspace.id),
      getActiveCategoriesForWorkspace(workspace.id),
      listStatusHistory(post.id),
      listMembers(workspace.id),
    ]);
  const assignees = members.map((m) => ({
    id: m.userId,
    name: m.user.name,
    email: m.user.email,
  }));

  // If this post was merged into another, resolve the target's URL for the notice.
  let mergedTarget: { href: string; title: string } | null = null;
  if (post.mergedIntoId) {
    const target = await getPost(post.mergedIntoId);
    if (target) {
      mergedTarget = {
        title: target.title,
        href: `/${slug}/feedback/${target.id}`,
      };
    }
  }

  return (
    <PostDetailContent
      assignees={assignees}
      backLabel={board.name}
      boardHref={`/${slug}/feedback`}
      boardIsArchived={board.isArchived}
      categories={categories}
      currentUserId={session.user.id}
      isAdminOrOwner={isAdminOrOwner}
      isMember={true}
      isSignedIn={true}
      mergedTarget={mergedTarget}
      post={post}
      statusHistory={statusHistory}
      votedByUser={votedByUser}
      workspaceId={workspace.id}
      workspaceStatuses={workspaceStatuses}
    />
  );
}
