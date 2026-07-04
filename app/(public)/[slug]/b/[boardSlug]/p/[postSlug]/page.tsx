import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EmbedResizeReporter } from "@/components/embed/resize-reporter";
import { PoweredByBadge } from "@/components/portal/powered-by-badge";
import { PostDetailContent } from "@/components/posts/post-detail-content";
import { PortalHeader } from "@/components/workspace/portal-header";
import { WORKSPACE_MEMBER } from "@/config/platform";
import { getCurrentSession } from "@/lib/authz";
import {
  getBoardById,
  getBoardBySlug,
  listBoardsForWorkspace,
} from "@/lib/boards/queries";
import { getActiveCategoriesForWorkspace } from "@/lib/categories/queries";
import {
  buildEmbedQuery,
  embedWrapperProps,
  parseEmbedParams,
} from "@/lib/embed/style";
import { getPost, getPostBySlug, listStatusHistory } from "@/lib/posts/queries";
import { hasUserVoted } from "@/lib/voting";
import { getActiveWorkspaceStatuses } from "@/lib/workspace-statuses/queries";
import {
  getWorkspaceBySlug,
  getWorkspaceMember,
} from "@/lib/workspaces/queries";

interface Props {
  params: Promise<{ slug: string; boardSlug: string; postSlug: string }>;
  searchParams: Promise<{
    embed?: string;
    theme?: string;
    accentColor?: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, boardSlug, postSlug } = await params;
  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) {
    return { title: "Post" };
  }
  const board = await getBoardBySlug(workspace.id, boardSlug);
  if (!board) {
    return { title: "Post" };
  }
  const post = await getPostBySlug(board.id, postSlug);
  return { title: post?.title ?? "Post" };
}

export default async function PostDetailPage({ params, searchParams }: Props) {
  const { slug, boardSlug, postSlug } = await params;
  const { embed, theme, accentColor } = await searchParams;
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

  // Private boards are members-only. Archived boards stay publicly readable
  // (read-only — voting is disabled via the board's archived flag).
  if (!board.isPublic && !isMember) {
    notFound();
  }

  const post = await getPostBySlug(board.id, postSlug);
  if (!post) {
    notFound();
  }

  // Pending (unapproved) feedback is visible to members only.
  if (!post.isApproved && !isMember) {
    notFound();
  }

  const isAdminOrOwner = !!member && member.role !== WORKSPACE_MEMBER;

  const [votedByUser, workspaceStatuses, categories, statusHistory] =
    await Promise.all([
      session ? hasUserVoted(post.id, { userId: session.user.id }) : false,
      getActiveWorkspaceStatuses(workspace.id),
      getActiveCategoriesForWorkspace(workspace.id),
      listStatusHistory(post.id),
    ]);

  const allBoards = await listBoardsForWorkspace(workspace.id);

  // Active boards a member can move this post to (excludes archived).
  const moveTargets = isMember
    ? allBoards
        .filter((b) => !b.isArchived)
        .map((b) => ({ id: b.id, name: b.name, slug: b.slug }))
    : [];
  const publicBoards = allBoards.filter((b) => b.isPublic && !b.isArchived);

  // If this post was merged into another, resolve the target's URL for the notice.
  let mergedTarget: { href: string; title: string } | null = null;
  if (post.mergedIntoId) {
    const target = await getPost(post.mergedIntoId);
    const targetBoard = target ? await getBoardById(target.boardId) : null;
    if (target && targetBoard) {
      mergedTarget = {
        title: target.title,
        href: `/${slug}/b/${targetBoard.slug}/p/${target.slug}${embedQuery}`,
      };
    }
  }

  const boardHref = `/${slug}/b/${boardSlug}`;

  return (
    <div
      className={`min-h-screen bg-background ${embedWrapper.className}`}
      style={embedWrapper.style}
    >
      {isEmbed && <EmbedResizeReporter />}
      {!isEmbed && (
        <PortalHeader
          activeBoardSlug={boardSlug}
          boards={publicBoards}
          changelogPublic={workspace.changelogPublic}
          isMember={isMember}
          isSignedIn={isSignedIn}
          logoUrl={workspace.logoUrl}
          roadmapPublic={workspace.roadmapPublic}
          slug={slug}
          userImage={session?.user.image}
          userName={session?.user.name}
          workspaceName={workspace.name}
        />
      )}
      {!isEmbed && <PoweredByBadge />}

      <PostDetailContent
        backLabel={board.name}
        boardHref={boardHref}
        boardIsArchived={board.isArchived}
        categories={categories}
        currentUserId={session?.user.id ?? null}
        embedQuery={embedQuery}
        isAdminOrOwner={isAdminOrOwner}
        isEmbed={isEmbed}
        isMember={isMember}
        isSignedIn={isSignedIn}
        mergedTarget={mergedTarget}
        moveTargets={moveTargets}
        post={post}
        statusHistory={statusHistory}
        votedByUser={votedByUser}
        workspaceId={workspace.id}
        workspaceSlug={slug}
        workspaceStatuses={workspaceStatuses}
      />
    </div>
  );
}
