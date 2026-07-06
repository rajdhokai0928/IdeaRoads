import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChangelogCommentSection } from "@/components/changelog/changelog-comment-section";
import { ChangelogLabelBadge } from "@/components/changelog/changelog-label-badge";
import { ChangelogReactions } from "@/components/changelog/changelog-reactions";
import { ChangelogShareButton } from "@/components/changelog/changelog-share-button";
import { PoweredByBadge } from "@/components/portal/powered-by-badge";
import { PortalHeader } from "@/components/workspace/portal-header";
import { getCurrentSession } from "@/lib/authz";
import { listBoardsForWorkspace } from "@/lib/boards/queries";
import { sanitizeChangelogHtml } from "@/lib/changelog/html";
import { getChangelogEntryById } from "@/lib/changelog/queries";
import { getReactionsForEntry } from "@/lib/changelog-comments/reactions";
import { portalBaseUrl } from "@/lib/urls";
import {
  getWorkspaceBySlug,
  getWorkspaceMember,
} from "@/lib/workspaces/queries";

interface Props {
  params: Promise<{ slug: string; entryId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, entryId } = await params;
  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) {
    return { title: "Changelog" };
  }

  const entry = await getChangelogEntryById(entryId, workspace.id);
  if (!entry?.isPublished) {
    return { title: "Changelog", robots: "noindex" };
  }

  const appUrl = portalBaseUrl();
  const title = `${entry.title} — ${workspace.name} Changelog`;

  return {
    title,
    openGraph: {
      title,
      url: `${appUrl}/${slug}/changelog/${entryId}`,
      type: "article",
    },
    robots: workspace.changelogPublic ? "index, follow" : "noindex, nofollow",
  };
}

export default async function PublicChangelogEntryPage({ params }: Props) {
  const { slug, entryId } = await params;

  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) {
    notFound();
  }

  const session = await getCurrentSession();
  const member = session
    ? await getWorkspaceMember(workspace.id, session.user.id)
    : null;

  if (!workspace.changelogPublic && !member) {
    notFound();
  }

  const entry = await getChangelogEntryById(entryId, workspace.id, {
    publicOnly: !member,
  });
  if (!entry?.isPublished) {
    notFound();
  }

  const isSignedIn = !!session;
  const renderedBody = sanitizeChangelogHtml(entry.body);
  const allBoards = await listBoardsForWorkspace(workspace.id);
  const publicBoards = allBoards.filter((b) => b.isPublic && !b.isArchived);
  const reactions = await getReactionsForEntry(
    entry.id,
    session?.user.id ?? null
  );
  const entryUrl = `${portalBaseUrl()}/${slug}/changelog/${entryId}`;

  return (
    <div className="min-h-screen bg-background">
      <PortalHeader
        active="changelog"
        boards={publicBoards}
        changelogPublic={workspace.changelogPublic}
        currentPath={`/${slug}/changelog/${entryId}`}
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
        {/* Back link */}
        <Link
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-8"
          href={`/${slug}/changelog`}
        >
          <ArrowLeft className="size-3.5" />
          All updates
        </Link>

        {/* Entry header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-4">
            <ChangelogLabelBadge label={entry.label} size="md" />
            {entry.publishedAt && (
              <time
                className="text-sm text-muted-foreground"
                dateTime={entry.publishedAt.toISOString()}
              >
                {format(entry.publishedAt, "MMMM d, yyyy")}
              </time>
            )}
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight leading-snug">
            {entry.title}
          </h1>
        </div>

        {/* Cover image */}
        {entry.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          // biome-ignore lint/performance/noImgElement: dynamic S3/R2/local upload URL, not known at build time for next/image
          <img
            alt=""
            className="mb-8 max-h-96 w-full border border-border object-cover"
            src={entry.coverImageUrl}
          />
        )}

        {/* Rendered body */}
        <div
          className="prose prose-sm max-w-none text-foreground prose-headings:font-semibold prose-a:text-primary prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-pre:bg-muted"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: server-side sanitized via DOMPurify
          dangerouslySetInnerHTML={{ __html: renderedBody }}
        />

        {/* Reactions + share */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
          <ChangelogReactions
            changelogEntryId={entry.id}
            initialReactions={reactions}
            isSignedIn={isSignedIn}
          />
          <ChangelogShareButton title={entry.title} url={entryUrl} />
        </div>

        {/* Linked posts */}
        {entry.linkedPosts.length > 0 && (
          <div className="mt-12 pt-8 border-t border-border">
            <h2 className="text-sm font-semibold text-foreground mb-4">
              Related Feedback
            </h2>
            <div className="space-y-2">
              {entry.linkedPosts.map((post) => (
                <Link
                  className="flex flex-col gap-2 px-4 py-3 border border-border hover:bg-muted/40 transition-colors group sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                  href={`/${slug}/b/${post.boardSlug}/p/${post.slug}`}
                  key={post.id}
                >
                  <span className="flex-1 min-w-0 text-sm font-medium text-foreground group-hover:text-foreground/80 transition-colors">
                    {post.title}
                  </span>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-muted-foreground">
                      ↑ {post.upvotes}
                    </span>
                    <span
                      className="text-[11px] font-semibold px-2 py-0.5"
                      style={{
                        borderRadius: 2,
                        backgroundColor: "#6b728018",
                        color: "#6b7280",
                      }}
                    >
                      {post.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Comments */}
        <div className="mt-12 pt-8 border-t border-border">
          <ChangelogCommentSection
            changelogEntryId={entry.id}
            currentUserId={session?.user.id ?? null}
            isMember={!!member}
            isSignedIn={isSignedIn}
          />
        </div>
      </div>
    </div>
  );
}
