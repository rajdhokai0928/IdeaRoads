"use client";

import {
  ArrowLeft,
  Buildings,
  CaretUpDown,
  ChartBar,
  Envelope,
  Flag,
  Gauge,
  List,
  Scroll,
  SignOut,
  UserCircle,
  Users,
  Wrench,
} from "@phosphor-icons/react";
import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SquareAvatar } from "@/components/ui/square-avatar";
import { PRODUCT_NAME } from "@/config/platform";
import { useIsMobile } from "@/hooks/use-mobile";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/orbit", label: "Overview", icon: ChartBar, exact: true },
  {
    href: "/orbit/workspaces",
    label: "Workspaces",
    icon: Buildings,
    exact: false,
  },
  { href: "/orbit/users", label: "Users", icon: Users, exact: false },
  {
    href: "/orbit/feature-flags",
    label: "Feature Flags",
    icon: Flag,
    exact: false,
  },
  { href: "/orbit/settings", label: "Settings", icon: Wrench, exact: false },
  { href: "/orbit/jobs", label: "Job Queue", icon: Gauge, exact: false },
  { href: "/orbit/audit-log", label: "Audit Log", icon: Scroll, exact: false },
  { href: "/orbit/email", label: "Email", icon: Envelope, exact: false },
  { href: "/orbit/account", label: "Account", icon: UserCircle, exact: true },
];

// Shared active-indicator layoutId — the bar smoothly slides between nav rows.
const NAV_INDICATOR_ID = "orbit-nav-active-indicator";

export function AdminSidebar({
  email,
  image,
  workspaceSlug,
}: {
  email: string;
  image?: string | null;
  workspaceSlug?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();
  const shouldReduceMotion = useReducedMotion();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is a watch-only trigger, not read in the body
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-5">
        <span className="grid size-9 shrink-0 place-items-center rounded-ir-sm bg-sidebar-primary font-black text-sidebar-primary-foreground text-xs">
          KR
        </span>
        <div className="min-w-0">
          <p className="font-black text-sm leading-none">{PRODUCT_NAME}</p>
          <p className="mt-1 text-2xs font-semibold uppercase tracking-ui text-sidebar-foreground/40">
            Orbit Admin
          </p>
        </div>
      </div>

      {/* Navigation */}
      <LayoutGroup id="orbit-nav">
        <nav className="min-h-0 flex-1 overflow-y-auto px-2.5 py-5">
          <p className="mb-2 px-3 text-2xs font-semibold uppercase tracking-ui text-sidebar-foreground/30">
            Navigation
          </p>
          <div className="space-y-0.5">
            {navItems.map(({ href, label, icon: Icon, exact }) => {
              const isActive = exact
                ? pathname === href
                : pathname.startsWith(href);
              return (
                <Link
                  className={cn(
                    "group relative flex cursor-pointer items-center gap-3 rounded-ir-sm px-3 py-2.5 text-xs font-semibold tracking-ui uppercase transition-colors duration-150 ease-ir-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40",
                    isActive
                      ? "bg-ir-primary/15 text-ir-primary-light"
                      : "text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                  href={href}
                  key={href}
                >
                  {isActive && (
                    <motion.span
                      className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-ir-primary"
                      layoutId={NAV_INDICATOR_ID}
                      transition={
                        shouldReduceMotion
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 500, damping: 40 }
                      }
                    />
                  )}
                  <Icon size={15} weight={isActive ? "fill" : "regular"} />
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>
      </LayoutGroup>

      {/* Footer */}
      <div className="border-t border-sidebar-border">
        {/* My Workspace quick link */}
        {workspaceSlug && (
          <div className="border-b border-sidebar-border px-2.5 py-2">
            <Link
              className="flex cursor-pointer items-center gap-2.5 rounded-ir-sm px-3 py-2 text-xs font-semibold text-sidebar-foreground/85 transition-colors duration-150 ease-ir-standard hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40"
              href={`/${workspaceSlug}`}
            >
              <ArrowLeft className="size-3.5 shrink-0" size={13} />
              <span>My Workspace</span>
            </Link>
          </div>
        )}

        {/* Account dropdown */}
        <DropdownMenu onOpenChange={setAccountOpen} open={accountOpen}>
          <DropdownMenuTrigger asChild>
            <button
              className="flex h-14 w-full min-w-0 cursor-pointer items-center gap-2.5 px-4 text-left transition-colors duration-150 ease-ir-standard hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40"
              type="button"
            >
              <SquareAvatar
                alt={email}
                fallback={email.charAt(0).toUpperCase()}
                imageUrl={image}
              />
              <span
                className="min-w-0 flex-1 truncate text-xs text-sidebar-foreground/70"
                title={email}
              >
                {email}
              </span>
              <motion.span
                animate={{ rotate: accountOpen ? 180 : 0 }}
                className="shrink-0 text-sidebar-foreground/60"
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.15,
                  ease: "easeOut",
                }}
              >
                <CaretUpDown className="size-4" />
              </motion.span>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="start"
            className="w-64 max-w-[calc(100vw-1rem)]"
            side="top"
            sideOffset={6}
          >
            <DropdownMenuLabel className="flex items-center gap-2.5 font-normal normal-case tracking-normal">
              <SquareAvatar
                alt={email}
                fallback={email.charAt(0).toUpperCase()}
                imageUrl={image}
              />
              <span
                className="flex-1 truncate text-xs font-medium text-ir-heading"
                title={email}
              >
                {email}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link href="/orbit/account">
                <UserCircle />
                Account
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                await signOut();
                router.push("/signin");
              }}
              variant="destructive"
            >
              <SignOut />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Sheet onOpenChange={setMobileOpen} open={mobileOpen}>
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-sidebar-border bg-sidebar px-4 text-sidebar-foreground">
          <SheetTrigger asChild>
            <motion.button
              aria-label="Open navigation"
              className="flex cursor-pointer items-center justify-center rounded-ir-sm p-1 text-sidebar-foreground/90 transition-colors duration-150 ease-ir-standard hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40"
              type="button"
              whileTap={shouldReduceMotion ? undefined : { scale: 0.9 }}
            >
              <List size={20} />
            </motion.button>
          </SheetTrigger>
          <span className="flex-1 truncate text-sm font-semibold">
            {PRODUCT_NAME} — Orbit Admin
          </span>
        </div>

        <SheetContent
          className="flex w-72 flex-col border-sidebar-border bg-sidebar p-0 text-sidebar-foreground"
          showCloseButton={false}
          side="left"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
            <SheetDescription>Orbit admin navigation menu</SheetDescription>
          </SheetHeader>
          {sidebarContent}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:w-72">
      {sidebarContent}
    </aside>
  );
}
