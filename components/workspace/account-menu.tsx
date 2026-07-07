"use client";

import {
  Bell,
  ChevronsUpDown,
  LogOut,
  ScrollText,
  Shield,
  Sliders,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SquareAvatar } from "@/components/ui/square-avatar";

interface AccountMenuProps {
  email: string;
  isAdminOrOwner: boolean;
  userImage: string | null;
  workspaceSlug: string;
}

export function AccountMenu({
  email,
  isAdminOrOwner,
  userImage,
  workspaceSlug,
}: AccountMenuProps) {
  const pathname = usePathname();

  const itemClass = (href: string) =>
    pathname.startsWith(href) ? "bg-accent text-accent-foreground" : "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex h-14 w-full min-w-0 cursor-pointer items-center gap-2.5 border-t border-sidebar-border px-4 text-left transition-colors duration-150 hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          type="button"
        >
          <SquareAvatar
            alt={email}
            className="shrink-0"
            fallback={email.charAt(0).toUpperCase()}
            imageUrl={userImage}
          />
          <span
            className="min-w-0 flex-1 truncate text-sm font-medium text-sidebar-foreground"
            title={email}
          >
            {email}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-sidebar-foreground/40" />
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
            imageUrl={userImage}
          />
          <span
            className="flex-1 truncate text-xs font-medium text-foreground"
            title={email}
          >
            {email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {isAdminOrOwner && (
          <>
            <DropdownMenuGroup>
              <DropdownMenuItem
                asChild
                className={itemClass(`/${workspaceSlug}/settings/general`)}
              >
                <Link href={`/${workspaceSlug}/settings/general`}>
                  <Sliders />
                  General
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                asChild
                className={itemClass(`/${workspaceSlug}/settings/members`)}
              >
                <Link href={`/${workspaceSlug}/settings/members`}>
                  <Users />
                  Members
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                asChild
                className={itemClass(`/${workspaceSlug}/settings/moderation`)}
              >
                <Link href={`/${workspaceSlug}/settings/moderation`}>
                  <Shield />
                  Moderation
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                asChild
                className={itemClass(`/${workspaceSlug}/settings/audit-log`)}
              >
                <Link href={`/${workspaceSlug}/settings/audit-log`}>
                  <ScrollText />
                  Audit Log
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuGroup>
          <DropdownMenuItem
            asChild
            className={itemClass(`/${workspaceSlug}/settings/notifications`)}
          >
            <Link href={`/${workspaceSlug}/settings/notifications`}>
              <Bell />
              Notification Preferences
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            asChild
            className={itemClass(`/${workspaceSlug}/settings/account`)}
          >
            <Link href={`/${workspaceSlug}/settings/account`}>
              <User />
              Account
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => logoutAction()} variant="destructive">
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
