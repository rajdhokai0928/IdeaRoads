import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NewFeedbackButton } from "@/components/embed/new-feedback-button";
import { EmbedResizeReporter } from "@/components/embed/resize-reporter";
import { PoweredByBadge } from "@/components/portal/powered-by-badge";
import {
  type BoardStatus,
  ManualRoadmapBoard,
} from "@/components/roadmap/manual/manual-roadmap-board";
import type { BoardItem } from "@/components/roadmap/manual/manual-roadmap-card";
import { ManualRoadmapProvider } from "@/components/roadmap/manual/manual-roadmap-search-context";
import { RoadmapBoard } from "@/components/roadmap/roadmap-board";
import { PortalHeader } from "@/components/workspace/portal-header";
import { getCurrentSession } from "@/lib/authz";
import { listBoardsForWorkspace } from "@/lib/boards/queries";
import { getActiveCategoriesForWorkspace } from "@/lib/categories/queries";
import {
  buildEmbedQuery,
  embedWrapperProps,
  parseEmbedParams,
} from "@/lib/embed/style";
import { getDerivedRoadmap } from "@/lib/roadmap/derived";
import { getManualRoadmap } from "@/lib/roadmap/manual";
import type { RoadmapSort } from "@/lib/roadmap/queries";
import {
  getWorkspaceBySlug,
  getWorkspaceMember,
} from "@/lib/workspaces/queries";
import { RoadmapFilters } from "./_components/roadmap-filters";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    accentColor?: string;
    category?: string;
    embed?: string;
    q?: string;
    sort?: string;
    theme?: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) {
    return { title: "Roadmap" };
  }
  return {
    title: `Roadmap — ${workspace.name}`,
    robots: workspace.roadmapPublic ? "index, follow" : "noindex, nofollow",
  };
}

export default async function RoadmapPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { category, q, sort, embed, theme, accentColor } = await searchParams;
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

  // When the roadmap is private it appears not to exist for non-members.
  if (!workspace.roadmapPublic && !isMember) {
    notFound();
  }

  const syncEnabled = workspace.roadmapSyncEnabled;
  const validCategoryId = category ?? "";
  const searchQuery = q ?? "";
  const validSort: RoadmapSort =
    sort === "latest_status_change" ? "latest_status_change" : "votes";

  const [derivedColumns, manual, allBoards, categories] = await Promise.all([
    syncEnabled
      ? getDerivedRoadmap(workspace.id, {
          // Fixed `false` on this public route — hidden posts and
          // private-board items must never surface here, even for a
          // signed-in workspace admin. Admins review those from
          // /settings/roadmap instead.
          isAdmin: false,
          userId: session?.user.id,
          categoryId: validCategoryId || undefined,
          search: searchQuery || undefined,
          sort: validSort,
        })
      : Promise.resolve([]),
    syncEnabled ? Promise.resolve(null) : getManualRoadmap(workspace.id),
    listBoardsForWorkspace(workspace.id),
    getActiveCategoriesForWorkspace(workspace.id),
  ]);

  const publicBoards = allBoards.filter((b) => b.isPublic && !b.isArchived);
  const activeBoards = allBoards.filter((b) => !b.isArchived);

  const manualStatuses: BoardStatus[] = (manual?.columns ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    color: c.color,
    itemCount: c.items.length,
  }));
  const manualItems: BoardItem[] = (manual?.columns ?? []).flatMap((c) =>
    c.items.map((i) => ({
      id: i.id,
      statusId: i.statusId,
      title: i.title,
      description: i.description,
      launchDate: i.launchDate ? i.launchDate.toISOString() : null,
      coverImage: i.coverImage,
      voteCount: i.voteCount,
      commentCount: i.commentCount,
      feedbackId: i.feedbackId,
    }))
  );

  const totalPosts = syncEnabled
    ? derivedColumns.reduce((n, c) => n + c.posts.length, 0)
    : manualItems.length;

  // The public portal never redirects into the workspace app — everyone here
  // (including signed-in members browsing the public roadmap) goes through
  // the public submission flow, signing in first if needed.
  const feedbackHref = activeBoards[0]
    ? isSignedIn
      ? `/${slug}/b/${activeBoards[0].slug}/new${embedQuery}`
      : `/signin?next=${encodeURIComponent(`/${slug}/b/${activeBoards[0].slug}/new${embedQuery}`)}`
    : null;

  return (
    <div
      className={`min-h-screen bg-ir-background ${embedWrapper.className}`}
      style={embedWrapper.style}
    >
      {isEmbed && <EmbedResizeReporter />}
      {!isEmbed && (
        <PortalHeader
          active="roadmap"
          boards={publicBoards}
          changelogPublic={workspace.changelogPublic}
          currentPath={`/${slug}/roadmap`}
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

      <main className="mx-auto flex max-w-5xl flex-col" id="main-content">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ir-border px-4 py-6 sm:px-8">
          <div>
            <h1 className="text-xl font-semibold text-ir-heading">Roadmap</h1>
            <p className="mt-1 text-sm text-ir-muted">
              {totalPosts === 0
                ? "No items on the roadmap yet."
                : `${totalPosts} item${totalPosts === 1 ? "" : "s"} across all columns`}
            </p>
          </div>
          {feedbackHref && <NewFeedbackButton href={feedbackHref} />}
        </div>

        {syncEnabled ? (
          <>
            <RoadmapFilters
              activeCategoryId={validCategoryId}
              activeSearch={searchQuery}
              activeSort={validSort}
              categories={categories}
            />
            <div className="flex-1">
              <RoadmapBoard
                columns={derivedColumns}
                isAdmin={false}
                isSignedIn={isSignedIn}
                workspaceSlug={slug}
              />
            </div>
          </>
        ) : (
          <div className="flex-1">
            {/* Manual roadmap is read-only on the public portal. The board
              still reads its (unused, since canManage is false) manage/add
              controls from this context internally, so it needs a provider
              here too even though the public page never renders the
              search/manage/add trigger buttons that normally supply it. */}
            <ManualRoadmapProvider>
              <ManualRoadmapBoard
                canManage={false}
                items={manualItems}
                statuses={manualStatuses}
                workspaceId={workspace.id}
              />
            </ManualRoadmapProvider>
          </div>
        )}
      </main>
    </div>
  );
}
