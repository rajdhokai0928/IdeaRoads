"use client";

import {
  CaretUpDown,
  Check,
  Plus,
  SidebarSimpleIcon,
} from "@phosphor-icons/react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SquareAvatar } from "@/components/ui/square-avatar";
import { cn } from "@/lib/utils";

interface WorkspaceOption {
  logoUrl: string | null;
  name: string;
  slug: string;
}

interface WorkspaceSwitcherProps {
  collapsed?: boolean;
  currentLogoUrl: string | null;
  currentName: string;
  currentSlug: string;
  // Expanded rail only: renders a dedicated, always-visible collapse-toggle
  // button next to the workspace logo (ChatGPT-style — never hidden, never
  // hover-dependent).
  onCollapse?: () => void;
  // Collapsed rail only: clicking the logo expands the sidebar instead of
  // opening the workspace-switch dropdown — there's no room for a second
  // "expand" row underneath, so this button does double duty. Switching
  // workspaces happens via the full switcher once expanded.
  onExpand?: () => void;
  workspaces: WorkspaceOption[];
}

export function WorkspaceSwitcher({
  currentLogoUrl,
  currentName,
  currentSlug,
  workspaces,
  collapsed = false,
  onCollapse,
  onExpand,
}: WorkspaceSwitcherProps) {
  const shouldReduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);

  if (collapsed && onExpand) {
    return (
      <button
        aria-label="Expand sidebar"
        className="group relative flex h-14 w-full cursor-pointer items-center justify-center border-b border-sidebar-border transition-colors duration-150 ease-ir-standard hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40"
        onClick={onExpand}
        title="Expand sidebar"
        type="button"
      >
        <SquareAvatar
          alt={currentName}
          className="shrink-0 rounded-ir-md bg-ir-primary text-ir-primary-foreground transition-opacity duration-150 ease-ir-standard group-hover:opacity-0"
          fallback={
            <span className="text-xs font-black">
              {currentName.charAt(0).toUpperCase()}
            </span>
          }
          imageUrl={currentLogoUrl}
        />
        <SidebarSimpleIcon className="absolute size-4 text-sidebar-foreground/85 opacity-0 transition-opacity duration-150 ease-ir-standard group-hover:opacity-100" />
      </button>
    );
  }

  const avatar = (
    <SquareAvatar
      alt={currentName}
      className="shrink-0 rounded-ir-md bg-ir-primary text-ir-primary-foreground"
      fallback={
        <span className="text-xs font-black">
          {currentName.charAt(0).toUpperCase()}
        </span>
      }
      imageUrl={currentLogoUrl}
    />
  );

  return (
    <div className="flex h-14 w-full min-w-0 items-center border-b border-sidebar-border">
      {/* Expanded rail only: a dedicated, always-visible toggle button next
          to the workspace logo — not a hover-reveal, so it's there whether
          or not the pointer is over it (ChatGPT's own sidebar icon is
          likewise a persistent, separate button, never hidden). */}
      {!collapsed && onCollapse && (
        <button
          aria-label="Collapse sidebar"
          className="flex h-14 w-11 shrink-0 cursor-pointer items-center justify-center text-sidebar-foreground/85 transition-colors duration-150 ease-ir-standard hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40"
          onClick={onCollapse}
          title="Collapse sidebar"
          type="button"
        >
          <SidebarSimpleIcon className="size-4" />
        </button>
      )}

      <DropdownMenu onOpenChange={setOpen} open={open}>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "flex h-14 min-w-0 flex-1 cursor-pointer items-center gap-2.5 text-left transition-colors duration-150 ease-ir-standard hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40",
              collapsed ? "justify-center px-0" : "pr-4 pl-2"
            )}
            title={collapsed ? currentName : undefined}
            type="button"
          >
            {avatar}
            {!collapsed && (
              <>
                <span
                  className="min-w-0 flex-1 truncate text-sm font-semibold text-sidebar-foreground"
                  title={currentName}
                >
                  {currentName}
                </span>
                <motion.span
                  animate={{ rotate: open ? 180 : 0 }}
                  className="shrink-0 text-sidebar-foreground/60"
                  transition={{
                    duration: shouldReduceMotion ? 0 : 0.15,
                    ease: "easeOut",
                  }}
                >
                  <CaretUpDown className="size-4" />
                </motion.span>
              </>
            )}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
          side="bottom"
          sideOffset={4}
        >
          <DropdownMenuGroup>
            {workspaces.map((ws) => {
              const isCurrent = ws.slug === currentSlug;

              return (
                <DropdownMenuItem
                  asChild
                  className={`normal-case tracking-normal ${
                    isCurrent ? "bg-ir-primary-light/20 text-ir-primary" : ""
                  }`}
                  key={ws.slug}
                >
                  <Link href={`/${ws.slug}`}>
                    {/* Let the fallback letter use SquareAvatar's own muted
                        color against its light idle background — the item's
                        universal focus rule (**:text-ir-primary) recolors it
                        on hover, same as every other dropdown in the app.
                        Forcing it to text-sidebar-foreground (meant for the
                        dark sidebar trigger) made it invisible here:
                        near-white text on the avatar's light
                        bg-ir-muted-surface square. */}
                    <SquareAvatar
                      alt={ws.name}
                      className="size-5 shrink-0 rounded-ir-md text-2xs font-semibold"
                      fallback={ws.name.charAt(0).toUpperCase()}
                      imageUrl={ws.logoUrl}
                    />
                    <span className="flex-1 truncate text-sm" title={ws.name}>
                      {ws.name}
                    </span>
                    {isCurrent && <Check className="size-3.5 shrink-0" />}
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <Link href="/onboarding?new=1">
              <Plus />
              Create workspace
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
