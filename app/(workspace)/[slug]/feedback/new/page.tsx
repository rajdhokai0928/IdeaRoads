import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentContainer } from "@/components/ui/page";
import { requireSession } from "@/lib/authz";
import { getWorkspaceBoard } from "@/lib/boards/queries";
import { getActiveCategoriesForWorkspace } from "@/lib/categories/queries";
import { getActiveWorkspaceStatuses } from "@/lib/workspace-statuses/queries";
import {
  getWorkspaceBySlug,
  getWorkspaceMember,
} from "@/lib/workspaces/queries";
import { NewFeedbackForm } from "../_components/new-feedback-form";

interface Props {
  params: Promise<{ slug: string }>;
}

export const metadata: Metadata = { title: "New Feedback" };

export default async function NewFeedbackPage({ params }: Props) {
  const { slug } = await params;
  const session = await requireSession();

  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) {
    notFound();
  }

  const member = await getWorkspaceMember(workspace.id, session.user.id);
  if (!member) {
    notFound();
  }

  const board = await getWorkspaceBoard(workspace.id);
  if (!board) {
    notFound();
  }

  const [categories, workspaceStatuses] = await Promise.all([
    getActiveCategoriesForWorkspace(workspace.id),
    getActiveWorkspaceStatuses(workspace.id),
  ]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-ir-border px-4 py-4 sm:px-8">
        <Link
          aria-label="Back to Feedback"
          className="flex cursor-pointer items-center justify-center rounded-ir-sm text-ir-muted transition-colors duration-150 ease-ir-standard hover:text-ir-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40"
          href={`/${slug}/feedback`}
          title="Back to Feedback"
        >
          <ArrowLeftIcon className="size-4" />
        </Link>
        <h2 className="text-sm font-semibold text-ir-heading">New Feedback</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        <ContentContainer>
          <NewFeedbackForm
            boardId={board.id}
            categories={categories}
            workspaceId={workspace.id}
            workspaceSlug={slug}
            workspaceStatuses={workspaceStatuses}
          />
        </ContentContainer>
      </div>
    </div>
  );
}
