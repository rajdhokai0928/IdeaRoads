"use client";

import { Check, ChevronsUpDown, Plus } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SquareAvatar } from "@/components/ui/square-avatar";

interface WorkspaceOption {
  logoUrl: string | null;
  name: string;
  slug: string;
}

interface WorkspaceSwitcherProps {
  currentLogoUrl: string | null;
  currentName: string;
  currentSlug: string;
  workspaces: WorkspaceOption[];
}

export function WorkspaceSwitcher({
  currentLogoUrl,
  currentName,
  currentSlug,
  workspaces,
}: WorkspaceSwitcherProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex h-14 w-full min-w-0 cursor-pointer items-center gap-2.5 border-b border-sidebar-border px-4 text-left transition-colors duration-150 hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          type="button"
        >
          <SquareAvatar
            alt={currentName}
            className="shrink-0 bg-primary text-primary-foreground"
            fallback={
              <span className="text-xs font-black">
                {currentName.charAt(0).toUpperCase()}
              </span>
            }
            imageUrl={currentLogoUrl}
          />
          <span
            className="min-w-0 flex-1 truncate text-sm font-semibold text-sidebar-foreground"
            title={currentName}
          >
            {currentName}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-sidebar-foreground/40" />
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
                  isCurrent ? "bg-accent text-accent-foreground" : ""
                }`}
                key={ws.slug}
              >
                <Link href={`/${ws.slug}`}>
                  {/* Pin the avatar's letter colour so the DropdownMenuItem's
                      focus rule (`**:text-accent-foreground`) can't recolour the
                      fallback letter to dark-on-dark and hide it on hover. */}
                  <SquareAvatar
                    alt={ws.name}
                    className="size-5 shrink-0 text-2xs font-semibold text-sidebar-foreground!"
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
  );
}
