import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WebhookEndpointsSection } from "@/components/settings/webhook-endpoints-section";
import { ContentContainer } from "@/components/ui/page";
import { WORKSPACE_MEMBER } from "@/config/platform";
import { requireSession } from "@/lib/authz";
import { isEncryptionAvailable } from "@/lib/encrypt";
import { listWebhookEndpoints } from "@/lib/webhooks/queries";
import {
  getWorkspaceBySlug,
  getWorkspaceMember,
} from "@/lib/workspaces/queries";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Webhooks — ${slug}` };
}

export default async function WebhooksPage({ params }: Props) {
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

  const endpoints = await listWebhookEndpoints(workspace.id);

  return (
    <ContentContainer>
      <WebhookEndpointsSection
        encryptionAvailable={isEncryptionAvailable()}
        endpoints={endpoints}
        workspaceId={workspace.id}
      />
    </ContentContainer>
  );
}
