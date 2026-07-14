import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EmbedDocs } from "@/components/settings/embed-docs";
import { EmbedSection } from "@/components/settings/embed-section";
import { ContentContainer } from "@/components/ui/page";
import { WORKSPACE_MEMBER } from "@/config/platform";
import { requireSession } from "@/lib/authz";
import { listBoardsForWorkspace } from "@/lib/boards/queries";
import { DEFAULT_EMBED_CONFIG, getEmbedConfig } from "@/lib/embed/queries";
import { portalBaseUrl } from "@/lib/urls";
import {
  getWorkspaceBySlug,
  getWorkspaceMember,
} from "@/lib/workspaces/queries";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Embed — ${slug}` };
}

export default async function EmbedPage({ params }: Props) {
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

  const [config, allBoards] = await Promise.all([
    getEmbedConfig(workspace.id),
    listBoardsForWorkspace(workspace.id),
  ]);
  // The embed is anonymous/public — only public, non-archived boards are
  // valid targets for it.
  const publicBoards = allBoards.filter((b) => b.isPublic && !b.isArchived);
  const defaultBoardId =
    (config?.boardId && publicBoards.some((b) => b.id === config.boardId)
      ? config.boardId
      : undefined) ??
    publicBoards[0]?.id ??
    "";

  return (
    <ContentContainer>
      <EmbedSection
        appUrl={portalBaseUrl()}
        boards={publicBoards.map((b) => ({
          id: b.id,
          name: b.name,
          slug: b.slug,
        }))}
        initialConfig={{
          boardId: defaultBoardId,
          mode: config?.mode ?? DEFAULT_EMBED_CONFIG.mode,
          position: config?.position ?? DEFAULT_EMBED_CONFIG.position,
          theme: config?.theme ?? DEFAULT_EMBED_CONFIG.theme,
          width: config?.width ?? DEFAULT_EMBED_CONFIG.width,
          height: config?.height ?? DEFAULT_EMBED_CONFIG.height,
          accentColor: config?.accentColor ?? DEFAULT_EMBED_CONFIG.accentColor,
        }}
        workspaceId={workspace.id}
        workspaceSlug={slug}
      />
      <EmbedDocs appUrl={portalBaseUrl()} />
    </ContentContainer>
  );
}
