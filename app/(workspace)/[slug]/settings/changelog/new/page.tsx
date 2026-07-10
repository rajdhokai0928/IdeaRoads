import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChangelogEditor } from "@/components/changelog/changelog-editor";
import { WORKSPACE_MEMBER } from "@/config/platform";
import { requireSession } from "@/lib/authz";
import { listChangelogLabels } from "@/lib/changelog/labels";
import {
  getWorkspaceBySlug,
  getWorkspaceMember,
} from "@/lib/workspaces/queries";

interface Props {
  params: Promise<{ slug: string }>;
}

export const metadata: Metadata = { title: "New Changelog Entry" };

export default async function NewChangelogEntryPage({ params }: Props) {
  const { slug } = await params;
  const session = await requireSession();

  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) {
    notFound();
  }

  const member = await getWorkspaceMember(workspace.id, session.user.id);
  if (!member || member.role === WORKSPACE_MEMBER) {
    notFound();
  }

  const initialLabels = await listChangelogLabels(workspace.id);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-ir-border px-4 py-4 sm:px-8">
        <Link
          aria-label="Back to Changelog"
          className="flex cursor-pointer items-center justify-center rounded-ir-sm text-ir-muted transition-colors duration-150 ease-ir-standard hover:text-ir-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40"
          href={`/${slug}/settings/changelog`}
          title="Back to Changelog"
        >
          <ArrowLeftIcon className="size-4" />
        </Link>
        <h2 className="text-sm font-semibold text-ir-heading">New Entry</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        <ChangelogEditor
          initialLabels={initialLabels}
          workspaceId={workspace.id}
          workspaceSlug={slug}
        />
      </div>
    </div>
  );
}
