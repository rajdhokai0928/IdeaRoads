import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PoweredByBadge } from "@/components/portal/powered-by-badge";
import { RoadmapBoard } from "@/components/roadmap/roadmap-board";
import { PortalHeader } from "@/components/workspace/portal-header";
import { WORKSPACE_MEMBER } from "@/config/platform";
import { getCurrentSession } from "@/lib/authz";
import { listBoardsForWorkspace } from "@/lib/boards/queries";
import { getActiveCategoriesForWorkspace } from "@/lib/categories/queries";
import type { RoadmapSort } from "@/lib/roadmap/queries";
import { listPostsForRoadmap } from "@/lib/roadmap/queries";
import {
  getWorkspaceBySlug,
  getWorkspaceMember,
} from "@/lib/workspaces/queries";
import { RoadmapFilters } from "./_components/roadmap-filters";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ category?: string; q?: string; sort?: string }>;
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
  const { category, q, sort } = await searchParams;

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
  const isAdmin = !!member && member.role !== WORKSPACE_MEMBER;

  // When the roadmap is private it appears not to exist for non-members.
  if (!workspace.roadmapPublic && !isMember) {
    notFound();
  }

  const validCategoryId = category ?? "";
  const searchQuery = q ?? "";
  const validSort: RoadmapSort =
    sort === "latest_status_change" ? "latest_status_change" : "votes";

  const [roadmapData, allBoards, categories] = await Promise.all([
    listPostsForRoadmap(workspace.id, {
      isAdmin,
      userId: session?.user.id,
      categoryId: validCategoryId || undefined,
      search: searchQuery || undefined,
      sort: validSort,
    }),
    listBoardsForWorkspace(workspace.id),
    getActiveCategoriesForWorkspace(workspace.id),
  ]);
  const publicBoards = allBoards.filter((b) => b.isPublic && !b.isArchived);
  const activeBoards = allBoards.filter((b) => !b.isArchived);

  const totalPosts =
    roadmapData.planned.length +
    roadmapData.in_progress.length +
    roadmapData.completed.length;

  // The public portal never redirects into the workspace app — everyone here
  // (including signed-in members browsing the public roadmap) goes through
  // the public submission flow, signing in first if needed.
  const feedbackHref = activeBoards[0]
    ? isSignedIn
      ? `/${slug}/b/${activeBoards[0].slug}/new`
      : `/signin?next=${encodeURIComponent(`/${slug}/b/${activeBoards[0].slug}/new`)}`
    : null;

  return (
    <div className="min-h-screen bg-background">
      <PortalHeader
        active="roadmap"
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
      <PoweredByBadge />

      <div className="max-w-5xl mx-auto flex flex-col">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-4 py-6 sm:px-8">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Roadmap</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {totalPosts === 0
                ? "No items on the roadmap yet."
                : `${totalPosts} item${totalPosts === 1 ? "" : "s"} across all columns`}
            </p>
          </div>
          {feedbackHref && (
            <Link
              className="flex items-center gap-1.5 bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors duration-150 hover:bg-primary/90"
              href={feedbackHref}
            >
              <Plus className="size-4" />
              Feedback
            </Link>
          )}
        </div>

        <RoadmapFilters
          activeCategoryId={validCategoryId}
          activeSearch={searchQuery}
          activeSort={validSort}
          categories={categories}
        />

        <div className="flex-1">
          <RoadmapBoard
            data={roadmapData}
            isAdmin={isAdmin}
            isSignedIn={isSignedIn}
            workspaceSlug={slug}
          />
        </div>
      </div>
    </div>
  );
}
