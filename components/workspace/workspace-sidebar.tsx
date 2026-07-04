"use client";

import {
  CircleDot,
  Code2,
  Inbox,
  Key,
  LayoutDashboard,
  LayoutGrid,
  Map as MapIcon,
  Megaphone,
  Menu,
  Shield,
  Tag,
  Webhook,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { NotificationBell } from "@/components/notifications/notification-bell";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AccountMenu } from "@/components/workspace/account-menu";
import { WorkspaceSwitcher } from "@/components/workspace/workspace-switcher";
import { useIsMobile } from "@/hooks/use-mobile";

interface Board {
  id: string;
  name: string;
  slug: string;
}

interface WorkspaceOption {
  logoUrl: string | null;
  name: string;
  slug: string;
}

interface WorkspaceSidebarProps {
  boards: Board[];
  email: string;
  initialUnreadCount?: number;
  isAdminOrOwner: boolean;
  isOrbitAdmin: boolean;
  userImage: string | null;
  workspaceLogoUrl: string | null;
  workspaceName: string;
  workspaceSlug: string;
  workspaces: WorkspaceOption[];
}

export function WorkspaceSidebar({
  boards,
  email,
  initialUnreadCount = 0,
  isAdminOrOwner,
  isOrbitAdmin,
  userImage,
  workspaceLogoUrl,
  workspaceName,
  workspaceSlug,
  workspaces,
}: WorkspaceSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the mobile drawer whenever the route changes (link clicks navigate
  // without unmounting this layout-persisted client component).
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is a watch-only trigger, not read in the body
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const link = (href: string, exact = false) => {
    const isActive = exact ? pathname === href : pathname.startsWith(href);
    return `flex cursor-pointer items-center gap-2 border-l-2 px-2 py-1.5 text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
      isActive
        ? "border-sidebar-foreground bg-sidebar-accent font-medium text-sidebar-foreground"
        : "border-transparent text-sidebar-foreground/70 hover:border-sidebar-foreground/20 hover:bg-sidebar-accent hover:text-sidebar-foreground"
    }`;
  };

  // The per-board "Feedback" links carry a ?board= query param (usePathname()
  // never includes the query string), so their active state needs its own check.
  const boardLink = (boardId: string) => {
    const isActive =
      pathname === `/${workspaceSlug}/feedback` &&
      searchParams.get("board") === boardId;
    return `flex cursor-pointer items-center gap-2 border-l-2 px-2 py-1.5 text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
      isActive
        ? "border-sidebar-foreground bg-sidebar-accent font-medium text-sidebar-foreground"
        : "border-transparent text-sidebar-foreground/70 hover:border-sidebar-foreground/20 hover:bg-sidebar-accent hover:text-sidebar-foreground"
    }`;
  };

  const sidebarContent = (
    <>
      {/* Workspace switcher */}
      <WorkspaceSwitcher
        currentLogoUrl={workspaceLogoUrl}
        currentName={workspaceName}
        currentSlug={workspaceSlug}
        workspaces={workspaces}
      />

      {/* Navigation */}
      <nav className="scrollbar-thin flex flex-1 flex-col overflow-y-auto p-2">
        {/* Dashboard + Notifications inbox */}
        <div className="space-y-0.5">
          <Link
            className={link(`/${workspaceSlug}`, true)}
            href={`/${workspaceSlug}`}
          >
            <LayoutDashboard className="size-4 shrink-0" />
            <span className="truncate">Dashboard</span>
          </Link>
          <NotificationBell
            initialCount={initialUnreadCount}
            workspaceSlug={workspaceSlug}
          />
        </div>

        {/* Feedback */}
        <div className="mt-4 space-y-0.5">
          <p className="px-2 pb-1 pt-2 text-2xs font-semibold uppercase tracking-eyebrow text-sidebar-foreground/40">
            Feedback
          </p>
          <Link
            className={link(`/${workspaceSlug}/feedback`)}
            href={`/${workspaceSlug}/feedback`}
          >
            <Inbox className="size-4 shrink-0" />
            <span className="truncate">All Feedback</span>
          </Link>
          {boards.map((board) => (
            <Link
              className={boardLink(board.id)}
              href={`/${workspaceSlug}/feedback?board=${board.id}`}
              key={board.id}
            >
              <LayoutGrid className="size-4 shrink-0" />
              <span className="truncate">{board.name}</span>
            </Link>
          ))}
        </div>

        {/* Publish */}
        <div className="mt-4 space-y-0.5">
          <p className="px-2 pb-1 pt-2 text-2xs font-semibold uppercase tracking-eyebrow text-sidebar-foreground/40">
            Publish
          </p>
          <Link
            className={link(`/${workspaceSlug}/settings/roadmap`)}
            href={`/${workspaceSlug}/settings/roadmap`}
          >
            <MapIcon className="size-4 shrink-0" />
            <span className="truncate">Roadmap</span>
          </Link>
          <Link
            className={link(`/${workspaceSlug}/settings/changelog`)}
            href={`/${workspaceSlug}/settings/changelog`}
          >
            <Megaphone className="size-4 shrink-0" />
            <span className="truncate">Changelog</span>
          </Link>
        </div>

        {/* Settings */}
        {isAdminOrOwner && (
          <div className="mt-2 space-y-0.5 border-t border-sidebar-border">
            <p className="px-2 pb-1 pt-1.5 text-2xs font-semibold uppercase tracking-eyebrow text-sidebar-foreground/40">
              Settings
            </p>
            <Link
              className={link(`/${workspaceSlug}/settings/boards`)}
              href={`/${workspaceSlug}/settings/boards`}
            >
              <LayoutGrid className="size-4 shrink-0" />
              <span className="truncate">Boards</span>
            </Link>
            <Link
              className={link(`/${workspaceSlug}/settings/categories`)}
              href={`/${workspaceSlug}/settings/categories`}
            >
              <Tag className="size-4 shrink-0" />
              <span className="truncate">Categories</span>
            </Link>
            <Link
              className={link(`/${workspaceSlug}/settings/statuses`)}
              href={`/${workspaceSlug}/settings/statuses`}
            >
              <CircleDot className="size-4 shrink-0" />
              <span className="truncate">Statuses</span>
            </Link>
            <Link
              className={link(`/${workspaceSlug}/settings/api-keys`)}
              href={`/${workspaceSlug}/settings/api-keys`}
            >
              <Key className="size-4 shrink-0" />
              <span className="truncate">API Keys</span>
            </Link>
            <Link
              className={link(`/${workspaceSlug}/settings/webhooks`)}
              href={`/${workspaceSlug}/settings/webhooks`}
            >
              <Webhook className="size-4 shrink-0" />
              <span className="truncate">Webhooks</span>
            </Link>
            <Link
              className={link(`/${workspaceSlug}/settings/embed`)}
              href={`/${workspaceSlug}/settings/embed`}
            >
              <Code2 className="size-4 shrink-0" />
              <span className="truncate">Embed</span>
            </Link>
          </div>
        )}
      </nav>

      {/* Orbit Admin quick link (admins only) */}
      {isOrbitAdmin && (
        <div className="border-t border-sidebar-border px-2 py-1.5">
          <Link
            className="flex cursor-pointer items-center gap-2 px-2 py-1.5 text-xs font-semibold text-sidebar-foreground/50 transition-colors duration-150 hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            href="/orbit"
          >
            <Shield className="size-3.5 shrink-0" />
            <span>Orbit Admin</span>
          </Link>
        </div>
      )}

      {/* User bar — click account name to open the settings menu */}
      <div className="border-t border-sidebar-border p-3">
        <AccountMenu
          email={email}
          isAdminOrOwner={isAdminOrOwner}
          userImage={userImage}
          workspaceSlug={workspaceSlug}
        />
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Sheet onOpenChange={setMobileOpen} open={mobileOpen}>
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-sidebar-border bg-sidebar px-4">
          <SheetTrigger asChild>
            <button
              aria-label="Open navigation"
              className="flex cursor-pointer items-center justify-center text-sidebar-foreground/70 transition-colors duration-150 hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              type="button"
            >
              <Menu className="size-5" />
            </button>
          </SheetTrigger>
          <span
            className="flex-1 truncate text-sm font-semibold text-sidebar-foreground"
            title={workspaceName}
          >
            {workspaceName}
          </span>
        </div>

        <SheetContent
          className="flex w-72 flex-col border-sidebar-border bg-sidebar p-0"
          showCloseButton={false}
          side="left"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
            <SheetDescription>Workspace navigation menu</SheetDescription>
          </SheetHeader>
          {sidebarContent}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      {sidebarContent}
    </aside>
  );
}
