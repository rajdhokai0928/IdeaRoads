import type { ReactNode } from "react";
import { WorkspaceSuspendedPage } from "@/components/workspace/workspace-suspended";
import { getWorkspaceBySlug } from "@/lib/workspaces/queries";

interface Props {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function PublicSlugLayout({ children, params }: Props) {
  const { slug } = await params;
  const workspace = await getWorkspaceBySlug(slug);

  if (!workspace) {
    return children;
  }

  // A suspended workspace is unavailable to everyone (PLATFORM.md §6).
  if (workspace.isSuspended) {
    return <WorkspaceSuspendedPage />;
  }

  return children;
}
