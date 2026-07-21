import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EmbedNav } from "@/components/embed/embed-nav";
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
import { EmbedPersonalizationProvider } from "@/lib/embed/personalization-context";
import {
  buildEmbedQuery,
  embedWrapperProps,
  parseEmbedParams,
} from "@/lib/embed/style";
import { resolveBackTarget } from "@/lib/navigation/back-target";
import { getPost, getPostBySlug, listStatusHistory } from "@/lib/posts/queries";
import { hasUserVoted } from "@/lib/voting";
import { getActiveWorkspaceStatuses } from "@/lib/workspace-statuses/queries";
import { listMembers } from "@/lib/workspaces/members";
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
    from?: string;
    fromLabel?: string;
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
  const { embed, theme, accentColor, from, fromLabel } = await searchParams;
  const embedParams = parseEmbedParams({ embed, theme, accentColor });
  // This page's own route param is the authoritative "current board" —
  // override whatever (if anything) was in the incoming URL so outgoing
  // links (Roadmap/Changelog nav, etc.) always carry the right one forward.
  embedParams.board = boardSlug;
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

  // Unpublished drafts never appear on the public portal — they are managed
  // from the admin feedback view until published.
  if (post.isDraft) {
    notFound();
  }

  // Hidden/unapproved feedback never appears on the public portal — not even
  // to a signed-in workspace member/admin. Visibility must not depend on the
  // viewer's identity; direct URLs to hidden posts always 404 here.
  if (!post.isApproved) {
    notFound();
  }

  const workspaceStatuses = await getActiveWorkspaceStatuses(workspace.id);

  // Statuses an admin has marked "hidden from public feed" (Completed, by
  // default) are blocked from direct URL access too — a direct link
  // shouldn't reveal what the public feed hides.
  const postWorkspaceStatus = workspaceStatuses.find(
    (s) => s.slug === post.status
  );
  if (postWorkspaceStatus && !postWorkspaceStatus.showOnPublicFeed) {
    notFound();
  }

  const isAdminOrOwner = !!member && member.role !== WORKSPACE_MEMBER;

  const [votedByUser, categories, statusHistory, allBoards, members] =
    await Promise.all([
      session ? hasUserVoted(post.id, { userId: session.user.id }) : false,
      getActiveCategoriesForWorkspace(workspace.id),
      listStatusHistory(post.id),
      listBoardsForWorkspace(workspace.id),
      isMember ? listMembers(workspace.id) : Promise.resolve([]),
    ]);

  const publicBoards = allBoards.filter((b) => b.isPublic && !b.isArchived);
  const assignees = members.map((m) => ({
    id: m.userId,
    name: m.user.name,
    email: m.user.email,
  }));

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

  // Back returns to wherever the user came from (e.g. the Roadmap) when a valid
  // `from` is supplied; otherwise it falls back to this post's board.
  const back = resolveBackTarget({
    from,
    fromLabel,
    fallbackHref: `/${slug}/b/${boardSlug}${embedQuery}`,
    fallbackLabel: board.name,
  });

  return (
    <EmbedPersonalizationProvider
      includeCommentOwnership
      includeModerator
      isEmbed={isEmbed}
      postIds={[post.id]}
      workspaceId={workspace.id}
    >
      <div
        className={`min-h-screen bg-ir-background ${embedWrapper.className}`}
        style={embedWrapper.style}
      >
        {isEmbed && <EmbedResizeReporter />}
        {isEmbed && (
          <EmbedNav
            active="feedback"
            boards={publicBoards}
            changelogPublic={workspace.changelogPublic}
            embedQuery={embedQuery}
            feedbackBoardSlug={boardSlug}
            isSignedIn={isSignedIn}
            roadmapPublic={workspace.roadmapPublic}
            slug={slug}
          />
        )}
        {!isEmbed && (
          <PortalHeader
            boards={publicBoards}
            changelogPublic={workspace.changelogPublic}
            currentPath={`/${slug}/b/${boardSlug}/p/${postSlug}${embedQuery}`}
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

        <main id="main-content">
          <PostDetailContent
            assignees={assignees}
            backLabel={back.label}
            boardHref={back.href}
            boardIsArchived={board.isArchived}
            categories={categories}
            currentUserId={session?.user.id ?? null}
            embedQuery={embedQuery}
            isAdminOrOwner={isAdminOrOwner}
            isEmbed={isEmbed}
            isMember={isMember}
            isPublicPortal
            isSignedIn={isSignedIn}
            mergedTarget={mergedTarget}
            post={post}
            statusHistory={statusHistory}
            votedByUser={votedByUser}
            workspaceId={workspace.id}
            workspaceStatuses={workspaceStatuses}
          />
        </main>
      </div>
    </EmbedPersonalizationProvider>
  );
}
