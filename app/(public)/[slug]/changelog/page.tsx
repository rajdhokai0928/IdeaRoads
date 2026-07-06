import { format } from "date-fns";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChangelogLabelBadge } from "@/components/changelog/changelog-label-badge";
import { PoweredByBadge } from "@/components/portal/powered-by-badge";
import { PortalHeader } from "@/components/workspace/portal-header";
import { getCurrentSession } from "@/lib/authz";
import { listBoardsForWorkspace } from "@/lib/boards/queries";
import { truncateHtmlToText } from "@/lib/changelog/html";
import { listChangelogEntries } from "@/lib/changelog/queries";
import { getNotificationPreferences } from "@/lib/notifications/queries";
import { portalBaseUrl } from "@/lib/urls";
import {
  getWorkspaceBySlug,
  getWorkspaceMember,
} from "@/lib/workspaces/queries";
import { ChangelogFilters } from "./_components/changelog-filters";
import { SubscribeToggle } from "./_components/subscribe-toggle";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ label?: string; q?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) {
    return { title: "Changelog" };
  }
  const title = `Changelog — ${workspace.name}`;
  return {
    title,
    openGraph: {
      title,
      url: `${portalBaseUrl()}/${slug}/changelog`,
      type: "website",
    },
    robots: workspace.changelogPublic ? "index, follow" : "noindex, nofollow",
  };
}

export default async function PublicChangelogIndexPage({
  params,
  searchParams,
}: Props) {
  const { slug } = await params;
  const { label, q } = await searchParams;

  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) {
    notFound();
  }

  const session = await getCurrentSession();
  const member = session
    ? await getWorkspaceMember(workspace.id, session.user.id)
    : null;

  // A private changelog is visible only to workspace members.
  if (!workspace.changelogPublic && !member) {
    notFound();
  }

  const activeLabel = label ?? "";
  const searchQuery = q ?? "";

  const [{ entries }, allBoards, notificationPrefs] = await Promise.all([
    listChangelogEntries(workspace.id, {
      includeDrafts: false,
      limit: 50,
      label: activeLabel || undefined,
      search: searchQuery || undefined,
    }),
    listBoardsForWorkspace(workspace.id),
    session ? getNotificationPreferences(session.user.id) : null,
  ]);
  const publicBoards = allBoards.filter((b) => b.isPublic && !b.isArchived);

  const isSignedIn = !!session;

  return (
    <div className="min-h-screen bg-background">
      <PortalHeader
        active="changelog"
        boards={publicBoards}
        changelogPublic={workspace.changelogPublic}
        currentPath={`/${slug}/changelog`}
        isMember={!!member}
        isSignedIn={isSignedIn}
        logoUrl={workspace.logoUrl}
        roadmapPublic={workspace.roadmapPublic}
        rssHref={`/${slug}/changelog/feed.xml`}
        slug={slug}
        userEmail={session?.user.email}
        userImage={session?.user.image}
        userName={session?.user.name}
        workspaceName={workspace.name}
      />
      <PoweredByBadge />

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 pt-10 pb-20">
        <h1 className="text-2xl font-bold text-foreground">Changelog</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The latest updates and improvements to {workspace.name}.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <ChangelogFilters
            activeLabel={activeLabel}
            activeSearch={searchQuery}
          />
          {isSignedIn && (
            <SubscribeToggle
              initialSubscribed={notificationPrefs?.emailChangelog ?? true}
            />
          )}
        </div>

        {entries.length === 0 ? (
          <div className="mt-12 border border-border p-10 text-center">
            <p className="text-sm text-muted-foreground">
              {activeLabel || searchQuery
                ? "No changelog items match your filters."
                : "No updates published yet. Check back soon."}
            </p>
          </div>
        ) : (
          <div className="mt-8 divide-y divide-border border-t border-border">
            {entries.map((entry) => (
              <article className="py-8" key={entry.id}>
                {entry.coverImageUrl && (
                  <Link
                    className="block mb-4"
                    href={`/${slug}/changelog/${entry.id}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {/* biome-ignore lint/performance/noImgElement: dynamic S3/R2/local upload URL, not known at build time for next/image */}
                    <img
                      alt=""
                      className="max-h-64 w-full border border-border object-cover"
                      src={entry.coverImageUrl}
                    />
                  </Link>
                )}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <ChangelogLabelBadge label={entry.label} />
                  {entry.publishedAt && (
                    <time
                      className="text-xs text-muted-foreground"
                      dateTime={new Date(entry.publishedAt).toISOString()}
                    >
                      {format(new Date(entry.publishedAt), "MMMM d, yyyy")}
                    </time>
                  )}
                </div>
                <h2 className="mt-3 text-lg font-semibold text-foreground">
                  <Link
                    className="hover:text-foreground/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    href={`/${slug}/changelog/${entry.id}`}
                  >
                    {entry.title}
                  </Link>
                </h2>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-3">
                  {truncateHtmlToText(entry.body, 240)}
                </p>
                <Link
                  className="mt-3 inline-block text-sm font-medium text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href={`/${slug}/changelog/${entry.id}`}
                >
                  Read more →
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
