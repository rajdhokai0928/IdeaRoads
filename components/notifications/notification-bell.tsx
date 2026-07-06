"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface NotificationBellProps {
  initialCount?: number;
  workspaceSlug: string;
}

export function NotificationBell({
  workspaceSlug,
  initialCount = 0,
}: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(initialCount);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pathname = usePathname();
  const isActive = pathname.startsWith(`/${workspaceSlug}/notifications`);

  useEffect(() => {
    const fetchCount = async () => {
      if (document.visibilityState === "hidden") {
        return;
      }
      try {
        const res = await fetch("/api/notifications/count");
        if (!res.ok) {
          return;
        }
        const data = await res.json();
        setUnreadCount(data.unreadCount ?? 0);
      } catch {
        // network failure — keep previous count
      }
    };

    fetchCount();
    intervalRef.current = setInterval(fetchCount, 30_000);
    document.addEventListener("visibilitychange", fetchCount);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener("visibilitychange", fetchCount);
    };
  }, []);

  const displayCount = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <Link
      className={`flex cursor-pointer items-center gap-2 border-l-2 px-2 py-1.5 text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        isActive
          ? "border-sidebar-foreground bg-sidebar-accent font-medium text-sidebar-foreground"
          : "border-transparent text-sidebar-foreground/70 hover:border-sidebar-foreground/20 hover:bg-sidebar-accent hover:text-sidebar-foreground"
      }`}
      href={`/${workspaceSlug}/notifications`}
    >
      <span className="relative shrink-0">
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center bg-destructive text-white text-2xs font-bold leading-none px-0.5">
            {displayCount}
          </span>
        )}
      </span>
      <span className="truncate">Notifications</span>
    </Link>
  );
}
