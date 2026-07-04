import { count, eq } from "drizzle-orm";
import { ExternalLink, Plus, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BreakdownCard } from "@/components/dashboard/breakdown-card";
import { LiveStreamCard } from "@/components/dashboard/live-stream-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { PostsTable } from "@/components/posts/posts-table";
import { WORKSPACE_MEMBER } from "@/config/platform";
import { workspaceMembers } from "@/db/schema";
import { requireSession } from "@/lib/authz";
import { listBoardsForWorkspace } from "@/lib/boards/queries";
import { getActiveCategoriesForWorkspace } from "@/lib/categories/queries";
import type { ActivityType, BreakdownPeriod } from "@/lib/dashboard/queries";
import {
  getBreakdownMetrics,
  getRecentActivity,
} from "@/lib/dashboard/queries";
import { db } from "@/lib/db";
import {
  countWorkspacePostsByStatus,
  listWorkspacePosts,
} from "@/lib/posts/queries";
import { getActiveWorkspaceStatuses } from "@/lib/workspace-statuses/queries";
import {
  getWorkspaceBySlug,
  getWorkspaceMember,
} from "@/lib/workspaces/queries";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ activityType?: string; period?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const workspace = await getWorkspaceBySlug(slug);
  return { title: workspace?.name ?? "Workspace" };
}

export default async function WorkspaceDashboardPage({
  params,
  searchParams,
}: Props) {
  const { slug } = await params;
  const { period, activityType } = await searchParams;
  const session = await requireSession();

  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) {
    notFound();
  }

  const member = await getWorkspaceMember(workspace.id, session.user.id);
  if (!member) {
    notFound();
  }

  const isAdminOrOwner = member.role !== WORKSPACE_MEMBER;
  const activePeriod: BreakdownPeriod =
    period === "7d" || period === "all" ? period : "30d";
  const activeActivityType: ActivityType =
    activityType === "post" ||
    activityType === "comment" ||
    activityType === "vote"
      ? activityType
      : "all";

  const [
    workspaceBoards,
    [{ memberCount }],
    statusCounts,
    breakdown,
    recentActivity,
    newestPosts,
    categories,
    workspaceStatuses,
  ] = await Promise.all([
    listBoardsForWorkspace(workspace.id),
    db
      .select({ memberCount: count() })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.workspaceId, workspace.id)),
    countWorkspacePostsByStatus(workspace.id),
    getBreakdownMetrics(workspace.id, activePeriod, new Date()),
    getRecentActivity(workspace.id, { limit: 8, type: activeActivityType }),
    listWorkspacePosts(workspace.id, {
      sort: "newest",
      userId: session.user.id,
      includeUnapproved: true,
      limit: 5,
    }),
    getActiveCategoriesForWorkspace(workspace.id),
    getActiveWorkspaceStatuses(workspace.id),
  ]);

  const activeBoards = workspaceBoards.filter((b) => !b.isArchived);
  const totalPosts = Object.values(statusCounts).reduce((sum, n) => sum + n, 0);
  const openPosts = statusCounts.open ?? 0;
  const plannedPosts = statusCounts.planned ?? 0;
  const completedPosts = statusCounts.completed ?? 0;

  const addFeedbackHref = activeBoards[0] ? `/${slug}/feedback?new=1` : null;
  const firstPublicBoard = activeBoards.find((b) => b.isPublic);
  const publicPortalHref = workspace.roadmapPublic
    ? `/${slug}/roadmap`
    : firstPublicBoard
      ? `/${slug}/b/${firstPublicBoard.slug}`
      : null;

  return (
    <div className="flex flex-col">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-4 py-6 sm:px-8">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {workspace.name}
          </h1>
          {workspace.description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {workspace.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {publicPortalHref && (
            <a
              className="flex items-center gap-1.5 border border-border px-3.5 py-2 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              href={publicPortalHref}
              rel="noopener noreferrer"
              target="_blank"
            >
              <ExternalLink className="size-4" />
              Open Public Portal
            </a>
          )}
          {addFeedbackHref && (
            <Link
              className="flex items-center gap-1.5 bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors duration-150 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              href={addFeedbackHref}
            >
              <Plus className="size-4" />
              Add Feedback
            </Link>
          )}
        </div>
      </div>

      <div className="px-4 py-8 space-y-8 sm:px-8">
        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard
            href={isAdminOrOwner ? `/${slug}/settings/boards` : undefined}
            label="Boards"
            value={activeBoards.length}
          />
          <StatCard
            href={isAdminOrOwner ? `/${slug}/settings/members` : undefined}
            label="Members"
            value={memberCount}
          />
          <StatCard
            href={`/${slug}/feedback`}
            label="Total posts"
            value={totalPosts}
          />
          <StatCard
            href={`/${slug}/feedback?status=open`}
            label="Open"
            value={openPosts}
          />
          <StatCard
            href={`/${slug}/feedback?status=planned`}
            label="Planned"
            value={plannedPosts}
            valueClassName="text-violet-600 dark:text-violet-400"
          />
          <StatCard
            href={`/${slug}/feedback?status=completed`}
            label="Completed"
            value={completedPosts}
            valueClassName="text-green-600 dark:text-green-400"
          />
        </div>

        {/* Breakdown + Live Stream */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <BreakdownCard metrics={breakdown} period={activePeriod} />
          <LiveStreamCard
            activity={recentActivity}
            activityType={activeActivityType}
            workspaceSlug={slug}
          />
        </div>

        {/* Newest Feedback */}
        <div className="border border-border">
          <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold text-foreground">
              Newest Feedback
            </h2>
            <Link
              className="px-3 py-1.5 text-xs font-medium border border-border hover:bg-muted transition-colors duration-150"
              href={`/${slug}/feedback`}
            >
              View All
            </Link>
          </div>
          <PostsTable
            categories={categories}
            isSignedIn={true}
            postHref={(post) => `/${slug}/feedback/${post.id}`}
            posts={newestPosts}
            workspaceStatuses={workspaceStatuses}
          />
        </div>

        {/* Getting started */}
        {memberCount === 1 && (
          <div className="border border-border bg-muted/30 px-6 py-5">
            <div className="flex items-start gap-4">
              <div className="flex size-9 shrink-0 items-center justify-center bg-background border border-border">
                <Users className="size-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  Invite your team
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Team members can manage boards, review feedback, and keep your
                  users updated.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
