import {
  PlusIcon as Plus,
  UsersThreeIcon as UsersThree,
} from "@phosphor-icons/react/dist/ssr";
import { count, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BreakdownCard } from "@/components/dashboard/breakdown-card";
import { LiveStreamCard } from "@/components/dashboard/live-stream-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RoadmapPreviewCard } from "@/components/dashboard/roadmap-preview-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { WorkspaceOverviewCard } from "@/components/dashboard/workspace-overview-card";
import { PostsTable } from "@/components/posts/posts-table";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page";
import { WORKSPACE_MEMBER } from "@/config/platform";
import { workspaceMembers } from "@/db/schema";
import { requireSession } from "@/lib/authz";
import { getWorkspaceBoard } from "@/lib/boards/queries";
import { getActiveCategoriesForWorkspace } from "@/lib/categories/queries";
import type { ActivityType, BreakdownPeriod } from "@/lib/dashboard/queries";
import {
  getBreakdownMetrics,
  getPreviousPeriodSnapshot,
  getRecentActivity,
  PERIOD_LABELS,
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

  const now = new Date();

  const [
    board,
    [{ memberCount }],
    statusCounts,
    previousSnapshot,
    breakdown,
    recentActivity,
    newestPosts,
    categories,
    workspaceStatuses,
  ] = await Promise.all([
    getWorkspaceBoard(workspace.id),
    db
      .select({ memberCount: count() })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.workspaceId, workspace.id)),
    countWorkspacePostsByStatus(workspace.id),
    getPreviousPeriodSnapshot(workspace.id, activePeriod, now),
    getBreakdownMetrics(workspace.id, activePeriod, now),
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

  const totalPosts = Object.values(statusCounts).reduce((sum, n) => sum + n, 0);
  const openPosts = statusCounts.open ?? 0;
  const underReviewPosts = statusCounts.under_review ?? 0;
  const plannedPosts = statusCounts.planned ?? 0;
  const inProgressPosts = statusCounts.in_progress ?? 0;
  const completedPosts = statusCounts.completed ?? 0;
  const closedPosts = statusCounts.closed ?? 0;

  const periodLabel = PERIOD_LABELS[activePeriod] ?? undefined;
  const previousMemberCount = previousSnapshot?.memberCount ?? null;
  const previousTotalPosts = previousSnapshot
    ? Object.values(previousSnapshot.statusCounts).reduce(
        (sum, n) => sum + n,
        0
      )
    : null;
  const previousOpenPosts = previousSnapshot?.statusCounts.open ?? null;
  const previousUnderReviewPosts =
    previousSnapshot?.statusCounts.under_review ?? null;
  const previousPlannedPosts = previousSnapshot?.statusCounts.planned ?? null;
  const previousInProgressPosts =
    previousSnapshot?.statusCounts.in_progress ?? null;
  const previousCompletedPosts =
    previousSnapshot?.statusCounts.completed ?? null;
  const previousClosedPosts = previousSnapshot?.statusCounts.closed ?? null;

  const addFeedbackHref = board ? `/${slug}/feedback?new=1` : null;

  return (
    <div className="flex flex-col">
      <PageHeader
        actions={
          addFeedbackHref ? (
            <Button asChild>
              <Link href={addFeedbackHref}>
                <Plus data-icon="inline-start" />
                Add Feedback
              </Link>
            </Button>
          ) : undefined
        }
        description={workspace.description || undefined}
        title={workspace.name}
      />

      <div className="space-y-8 px-4 py-8 sm:px-8">
        {/* Workspace Overview */}
        <WorkspaceOverviewCard
          boardIsPublic={board?.isPublic ?? null}
          createdAt={workspace.createdAt}
          description={workspace.description}
          logoUrl={workspace.logoUrl}
          memberCount={memberCount}
          name={workspace.name}
        />

        {/* Quick Actions */}
        <QuickActions
          addFeedbackHref={addFeedbackHref}
          isAdminOrOwner={isAdminOrOwner}
          workspaceSlug={slug}
        />

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            href={isAdminOrOwner ? `/${slug}/settings/members` : undefined}
            label="Members"
            periodLabel={periodLabel}
            previousValue={previousMemberCount}
            value={memberCount}
          />
          <StatCard
            href={`/${slug}/feedback`}
            label="Total posts"
            periodLabel={periodLabel}
            previousValue={previousTotalPosts}
            value={totalPosts}
          />
          <StatCard
            href={`/${slug}/feedback?status=open`}
            label="Open"
            periodLabel={periodLabel}
            previousValue={previousOpenPosts}
            value={openPosts}
          />
          <StatCard
            href={`/${slug}/feedback?status=under_review`}
            label="Under Review"
            periodLabel={periodLabel}
            previousValue={previousUnderReviewPosts}
            value={underReviewPosts}
            valueClassName="text-ir-primary"
          />
          <StatCard
            href={`/${slug}/feedback?status=planned`}
            label="Planned"
            periodLabel={periodLabel}
            previousValue={previousPlannedPosts}
            value={plannedPosts}
            valueClassName="text-ir-primary"
          />
          <StatCard
            href={`/${slug}/feedback?status=in_progress`}
            label="In Progress"
            periodLabel={periodLabel}
            previousValue={previousInProgressPosts}
            value={inProgressPosts}
            valueClassName="text-ir-warning"
          />
          <StatCard
            href={`/${slug}/feedback?status=completed`}
            label="Completed"
            periodLabel={periodLabel}
            previousValue={previousCompletedPosts}
            value={completedPosts}
            valueClassName="text-ir-success"
          />
          <StatCard
            href={`/${slug}/feedback?status=closed`}
            label="Closed"
            periodLabel={periodLabel}
            previousValue={previousClosedPosts}
            value={closedPosts}
            valueClassName="text-ir-muted"
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

        {/* Roadmap Preview */}
        <RoadmapPreviewCard
          roadmapPublic={workspace.roadmapPublic}
          workspaceSlug={slug}
        />

        {/* Newest Feedback */}
        <div className="rounded-ir-card border border-ir-border bg-ir-surface shadow-ir-xs">
          <div className="flex items-center justify-between gap-4 border-b border-ir-border px-5 py-4">
            <h2 className="text-sm font-semibold text-ir-heading">
              Newest Feedback
            </h2>
            <Link
              className="rounded-ir-sm border border-ir-border px-3 py-1.5 text-xs font-medium text-ir-body transition-colors duration-150 ease-ir-standard hover:bg-ir-muted-surface"
              href={`/${slug}/feedback`}
            >
              View All
            </Link>
          </div>
          <PostsTable
            categories={categories}
            isAdminOrOwner={isAdminOrOwner}
            isMember={true}
            isSignedIn={true}
            postHref={(post) => `/${slug}/feedback/${post.id}`}
            posts={newestPosts}
            workspaceId={workspace.id}
            workspaceStatuses={workspaceStatuses}
          />
        </div>

        {/* Getting started */}
        {memberCount === 1 && (
          <div className="rounded-ir-card border border-ir-border bg-ir-muted-surface px-6 py-5">
            <div className="flex items-start gap-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-ir-sm border border-ir-border bg-ir-surface">
                <UsersThree className="size-4 text-ir-muted" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ir-heading">
                  Invite your team
                </p>
                <p className="mt-1 text-xs text-ir-muted">
                  Team members can review feedback and keep your users updated.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
