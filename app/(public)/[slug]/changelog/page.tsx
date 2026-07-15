import { format } from "date-fns";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChangelogLabelBadge } from "@/components/changelog/changelog-label-badge";
import { ChangelogReactions } from "@/components/changelog/changelog-reactions";
import { ChangelogShareButton } from "@/components/changelog/changelog-share-button";
import { EmbedResizeReporter } from "@/components/embed/resize-reporter";
import { PoweredByBadge } from "@/components/portal/powered-by-badge";
import { PortalHeader } from "@/components/workspace/portal-header";
import { getCurrentSession } from "@/lib/authz";
import { listBoardsForWorkspace } from "@/lib/boards/queries";
import { truncateHtmlToText } from "@/lib/changelog/html";
import { listChangelogEntries } from "@/lib/changelog/queries";
import { getReactionsForEntries } from "@/lib/changelog-comments/reactions";
import {
  buildEmbedQuery,
  embedWrapperProps,
  parseEmbedParams,
} from "@/lib/embed/style";
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
  searchParams: Promise<{
    accentColor?: string;
    embed?: string;
    label?: string;
    q?: string;
    theme?: string;
  }>;
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
  const { label, q, embed, theme, accentColor } = await searchParams;
  const embedParams = parseEmbedParams({ embed, theme, accentColor });
  const { isEmbed } = embedParams;
  const embedQuery = buildEmbedQuery(embedParams);
  const embedWrapper = embedWrapperProps(embedParams);

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
  const reactionsByEntry = await getReactionsForEntries(
    entries.map((e) => e.id),
    session?.user.id ?? null
  );

  const isSignedIn = !!session;
  const baseUrl = portalBaseUrl();

  return (
    <div
      className={`min-h-screen bg-ir-background ${embedWrapper.className}`}
      style={embedWrapper.style}
    >
      {isEmbed && <EmbedResizeReporter />}
      {!isEmbed && (
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
      )}
      {!isEmbed && <PoweredByBadge />}

      {/* Content */}
      <main
        className="mx-auto max-w-3xl px-4 pt-10 pb-20 sm:px-8"
        id="main-content"
      >
        <h1 className="text-xl font-semibold text-ir-heading">Changelog</h1>
        <p className="mt-1 text-sm text-ir-muted">
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
          <div className="mt-12 rounded-ir-card border border-ir-border bg-ir-surface p-10 text-center">
            <p className="text-sm text-ir-muted">
              {activeLabel || searchQuery
                ? "No changelog items match your filters."
                : "No updates published yet. Check back soon."}
            </p>
          </div>
        ) : (
          <div className="relative mt-10 space-y-10 border-l border-ir-border pl-8">
            {entries.map((entry) => (
              <article className="relative" key={entry.id}>
                <span className="absolute top-1.5 -left-8 size-2 shrink-0 -translate-x-1/2 rounded-ir-full bg-ir-primary ring-4 ring-ir-background" />

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  {entry.publishedAt && (
                    <time
                      className="text-xs font-semibold tracking-wide text-ir-muted uppercase"
                      dateTime={new Date(entry.publishedAt).toISOString()}
                    >
                      {format(new Date(entry.publishedAt), "MMMM d, yyyy")}
                    </time>
                  )}
                  <ChangelogLabelBadge label={entry.label} />
                </div>

                <div className="mt-3 rounded-ir-card border border-ir-border bg-ir-surface p-5 shadow-ir-xs transition-shadow duration-150 ease-ir-standard hover:shadow-ir-sm">
                  {entry.coverImageUrl && (
                    <Link
                      className="mb-4 block"
                      href={`/${slug}/changelog/${entry.id}${embedQuery}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {/* biome-ignore lint/performance/noImgElement: dynamic S3/R2/local upload URL, not known at build time for next/image */}
                      <img
                        alt=""
                        className="max-h-64 w-full rounded-ir-sm border border-ir-border object-cover"
                        src={entry.coverImageUrl}
                      />
                    </Link>
                  )}
                  <h2 className="text-lg font-semibold text-ir-heading">
                    <Link
                      className="transition-colors duration-150 ease-ir-standard hover:text-ir-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40"
                      href={`/${slug}/changelog/${entry.id}${embedQuery}`}
                    >
                      {entry.title}
                    </Link>
                  </h2>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ir-muted">
                    {truncateHtmlToText(entry.body, 240)}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-ir-border pt-4">
                    <ChangelogReactions
                      changelogEntryId={entry.id}
                      initialReactions={reactionsByEntry.get(entry.id) ?? []}
                      isSignedIn={isSignedIn}
                    />
                    <div className="flex shrink-0 items-center gap-3">
                      {/* <Link
                        className="text-sm font-medium text-ir-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40"
                        href={`/${slug}/changelog/${entry.id}`}
                      >
                        Read more →
                      </Link> */}
                      <ChangelogShareButton
                        title={entry.title}
                        url={`${baseUrl}/${slug}/changelog/${entry.id}`}
                      />
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
