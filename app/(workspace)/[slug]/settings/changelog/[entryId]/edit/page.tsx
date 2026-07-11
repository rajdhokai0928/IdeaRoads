import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChangelogCommentSection } from "@/components/changelog/changelog-comment-section";
import { ChangelogEditor } from "@/components/changelog/changelog-editor";
import { ContentContainer } from "@/components/ui/page";
import { WORKSPACE_MEMBER } from "@/config/platform";
import { requireSession } from "@/lib/authz";
import { listChangelogLabels } from "@/lib/changelog/labels";
import { getChangelogEntryById } from "@/lib/changelog/queries";
import {
  getWorkspaceBySlug,
  getWorkspaceMember,
} from "@/lib/workspaces/queries";

interface Props {
  params: Promise<{ slug: string; entryId: string }>;
}

export const metadata: Metadata = { title: "Edit Changelog Entry" };

export default async function EditChangelogEntryPage({ params }: Props) {
  const { slug, entryId } = await params;
  const session = await requireSession();

  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) {
    notFound();
  }

  const member = await getWorkspaceMember(workspace.id, session.user.id);
  if (!member || member.role === WORKSPACE_MEMBER) {
    notFound();
  }

  const entry = await getChangelogEntryById(entryId, workspace.id);
  if (!entry) {
    notFound();
  }

  const initialLabels = await listChangelogLabels(workspace.id);

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-ir-border px-4 py-4 sm:px-8">
        <Link
          aria-label="Back to Changelog"
          className="flex cursor-pointer items-center justify-center rounded-ir-sm text-ir-muted transition-colors duration-150 ease-ir-standard hover:text-ir-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40"
          href={`/${slug}/settings/changelog`}
          title="Back to Changelog"
        >
          <ArrowLeftIcon className="size-4" />
        </Link>
        <h2 className="text-sm font-semibold text-ir-heading">
          {entry.isPublished ? "Edit Published Entry" : "Edit Draft"}
        </h2>
        {entry.isPublished && (
          <span className="text-xs text-ir-muted">
            Changes are immediately live
          </span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        <ChangelogEditor
          initialEntry={{
            id: entry.id,
            title: entry.title,
            body: entry.body,
            coverImageUrl: entry.coverImageUrl,
            label: entry.label,
            isPublished: entry.isPublished,
            linkedPosts: entry.linkedPosts,
          }}
          initialLabels={initialLabels}
          workspaceId={workspace.id}
          workspaceSlug={slug}
        />
        <ContentContainer className="pb-10">
          <div className="border-t border-ir-border pt-8">
            <ChangelogCommentSection
              canModerate={true}
              changelogEntryId={entry.id}
              currentUserId={session.user.id}
              isSignedIn={true}
            />
          </div>
        </ContentContainer>
      </div>
    </div>
  );
}
