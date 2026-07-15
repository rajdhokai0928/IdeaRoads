import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { EmbedResizeReporter } from "@/components/embed/resize-reporter";
import { PoweredByBadge } from "@/components/portal/powered-by-badge";
import { PortalHeader } from "@/components/workspace/portal-header";
import { getCurrentSession } from "@/lib/authz";
import { getBoardBySlug, listBoardsForWorkspace } from "@/lib/boards/queries";
import { getActiveCategoriesForWorkspace } from "@/lib/categories/queries";
import {
  buildEmbedQuery,
  embedWrapperProps,
  parseEmbedParams,
} from "@/lib/embed/style";
import {
  getWorkspaceBySlug,
  getWorkspaceMember,
} from "@/lib/workspaces/queries";
import NewPostForm from "./_components/new-post-form";

interface Props {
  params: Promise<{ slug: string; boardSlug: string }>;
  searchParams: Promise<{
    embed?: string;
    theme?: string;
    accentColor?: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, boardSlug } = await params;
  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) {
    return { title: "New Post" };
  }
  const board = await getBoardBySlug(workspace.id, boardSlug);
  return { title: `New post — ${board?.name ?? "Board"}` };
}

export default async function NewPostPage({ params, searchParams }: Props) {
  const { slug, boardSlug } = await params;
  const { embed, theme, accentColor } = await searchParams;
  const embedParams = parseEmbedParams({ embed, theme, accentColor });
  const { isEmbed } = embedParams;
  const embedQuery = buildEmbedQuery(embedParams);
  const embedWrapper = embedWrapperProps(embedParams);

  // Submitting feedback requires a signed-in User — send visitors to sign in.
  const session = await getCurrentSession();
  if (!session) {
    redirect(
      `/signin?next=${encodeURIComponent(`/${slug}/b/${boardSlug}/new${embedQuery}`)}`
    );
  }

  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) {
    notFound();
  }

  const board = await getBoardBySlug(workspace.id, boardSlug);
  if (!board) {
    notFound();
  }

  const member = await getWorkspaceMember(workspace.id, session.user.id);

  // Anyone signed in may submit on a public board; private/archived boards are
  // restricted to workspace members.
  if ((!board.isPublic || board.isArchived) && !member) {
    notFound();
  }

  const [categories, allBoards] = await Promise.all([
    getActiveCategoriesForWorkspace(workspace.id),
    listBoardsForWorkspace(workspace.id),
  ]);
  const publicBoards = allBoards.filter((b) => b.isPublic && !b.isArchived);

  return (
    <div
      className={`min-h-screen bg-ir-background ${embedWrapper.className}`}
      style={embedWrapper.style}
    >
      {isEmbed && <EmbedResizeReporter />}
      {!isEmbed && (
        <PortalHeader
          boards={publicBoards}
          changelogPublic={workspace.changelogPublic}
          isMember={!!member}
          isSignedIn={true}
          logoUrl={workspace.logoUrl}
          roadmapPublic={workspace.roadmapPublic}
          slug={slug}
          userEmail={session.user.email}
          userImage={session.user.image}
          userName={session.user.name}
          workspaceName={workspace.name}
        />
      )}
      {!isEmbed && <PoweredByBadge />}
      <main className="mx-auto max-w-5xl" id="main-content">
        <NewPostForm
          boardId={board.id}
          boardName={board.name}
          boardSlug={boardSlug}
          categories={categories}
          embedQuery={embedQuery}
          isEmbed={isEmbed}
          workspaceId={workspace.id}
          workspaceSlug={slug}
        />
      </main>
    </div>
  );
}
