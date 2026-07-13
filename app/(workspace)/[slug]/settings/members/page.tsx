import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentContainer } from "@/components/ui/page";
import { WORKSPACE_MEMBER } from "@/config/platform";
import { requireSession } from "@/lib/authz";
import { listMembers } from "@/lib/workspaces/members";
import {
  getWorkspaceBySlug,
  getWorkspaceMember,
} from "@/lib/workspaces/queries";
import { MembersTable } from "./_components/members-table";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Members — ${slug}` };
}

export default async function MembersPage({ params }: Props) {
  const { slug } = await params;
  const session = await requireSession();

  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) {
    notFound();
  }

  // Workspace settings are Brand Admin only (PLATFORM.md §7).
  const actorMember = await getWorkspaceMember(workspace.id, session.user.id);
  if (!actorMember || actorMember.role === WORKSPACE_MEMBER) {
    notFound();
  }

  const members = await listMembers(workspace.id);

  return (
    <ContentContainer>
      <p className="mb-4 text-xs font-semibold tracking-eyebrow text-ir-muted uppercase">
        {members.length} {members.length === 1 ? "member" : "members"}
      </p>
      <MembersTable
        actorMemberId={actorMember.id}
        actorRole={actorMember.role}
        actorUserId={session.user.id}
        members={members}
        workspaceId={workspace.id}
      />
    </ContentContainer>
  );
}
