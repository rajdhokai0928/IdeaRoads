import { notFound, redirect } from "next/navigation";
import { NotificationsProvider } from "@/components/notifications/notifications-context";
import { PortalHrefProvider } from "@/components/workspace/open-portal-button";
import { WorkspaceSidebar } from "@/components/workspace/workspace-sidebar";
import { WorkspaceSuspendedPage } from "@/components/workspace/workspace-suspended";
import { ADMIN_ROLE, WORKSPACE_MEMBER } from "@/config/platform";
import { getCurrentSession } from "@/lib/authz";
import { getWorkspaceBoard } from "@/lib/boards/queries";
import { getUnreadCount } from "@/lib/notifications/queries";
import {
  getUserWorkspaces,
  getWorkspaceBySlug,
  getWorkspaceMember,
} from "@/lib/workspaces/queries";

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function WorkspaceLayout({
  children,
  params,
}: WorkspaceLayoutProps) {
  const { slug } = await params;

  const session = await getCurrentSession();

  // The entire workspace app is a separate, member-only application from the
  // public portal — it must never redirect an unauthenticated or non-member
  // visitor into the public portal. Anonymous visitors go to sign-in (with
  // `next` preserved so they land back here once authenticated); signed-in
  // non-members (customers) get a 404, keeping the admin area's existence
  // invisible to them, same as the rest of the admin surface.
  if (!session) {
    redirect(`/signin?next=${encodeURIComponent(`/${slug}`)}`);
  }

  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) {
    notFound();
  }

  // A suspended workspace is unavailable to everyone (PLATFORM.md §6) — Orbit
  // Admins govern it from /orbit, not from the live workspace.
  if (workspace.isSuspended) {
    return <WorkspaceSuspendedPage />;
  }

  const member = await getWorkspaceMember(workspace.id, session.user.id);
  if (!member) {
    notFound();
  }

  const isOrbitAdmin = session.user.role === ADMIN_ROLE;
  const isAdminOrOwner = member.role !== WORKSPACE_MEMBER;
  const email = session.user.email;
  const userWorkspaces = await getUserWorkspaces(session.user.id);
  const unreadCount = await getUnreadCount(session.user.id);

  // Resolve the workspace's public-portal entry point once, shared with every
  // page header via context (same logic as the Dashboard button): the public
  // roadmap if enabled, else the public board, else nothing.
  const board = await getWorkspaceBoard(workspace.id);
  const portalHref = workspace.roadmapPublic
    ? `/${slug}/roadmap`
    : board?.isPublic
      ? `/${slug}/b/${board.slug}`
      : null;

  return (
    <NotificationsProvider initialUnreadCount={unreadCount}>
      <div className="fixed inset-0 flex flex-col overflow-hidden md:flex-row">
        <WorkspaceSidebar
          email={email}
          initialUnreadCount={unreadCount}
          isAdminOrOwner={isAdminOrOwner}
          isOrbitAdmin={isOrbitAdmin}
          userImage={session.user.image ?? null}
          workspaceLogoUrl={workspace.logoUrl}
          workspaceName={workspace.name}
          workspaceSlug={workspace.slug}
          workspaces={userWorkspaces}
        />

        {/* Main content */}
        <main
          className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-background"
          id="main-content"
        >
          <PortalHrefProvider href={portalHref}>{children}</PortalHrefProvider>
        </main>
      </div>
    </NotificationsProvider>
  );
}
