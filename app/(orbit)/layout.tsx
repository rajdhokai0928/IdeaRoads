import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { requireAdmin } from "@/lib/authz";
import { getFirstUserWorkspace } from "@/lib/workspaces/queries";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireAdmin();
  const workspace = await getFirstUserWorkspace(session.user.id);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-page md:flex-row">
      <AdminSidebar
        email={session.user.email}
        image={session.user.image ?? null}
        workspaceSlug={workspace?.slug}
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-8">{children}</main>
    </div>
  );
}
