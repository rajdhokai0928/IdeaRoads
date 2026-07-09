import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentContainer } from "@/components/ui/page";
import { ApiKeyDocs } from "@/components/settings/api-key-docs";
import { ApiKeysSection } from "@/components/settings/api-keys-section";
import { WORKSPACE_MEMBER } from "@/config/platform";
import { listApiKeys } from "@/lib/api-keys/queries";
import { requireSession } from "@/lib/authz";
import { adminBaseUrl } from "@/lib/urls";
import {
  getWorkspaceBySlug,
  getWorkspaceMember,
} from "@/lib/workspaces/queries";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: `API Keys — ${slug}` };
}

export default async function ApiKeysPage({ params }: Props) {
  const { slug } = await params;
  const session = await requireSession();

  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) {
    notFound();
  }

  // Workspace settings are Brand Admin only (PLATFORM.md §7).
  const member = await getWorkspaceMember(workspace.id, session.user.id);
  if (!member || member.role === WORKSPACE_MEMBER) {
    notFound();
  }

  const keys = await listApiKeys(workspace.id);

  return (
    <ContentContainer>
      <ApiKeysSection keys={keys} workspaceId={workspace.id} />
      <ApiKeyDocs appUrl={adminBaseUrl()} />
    </ContentContainer>
  );
}
