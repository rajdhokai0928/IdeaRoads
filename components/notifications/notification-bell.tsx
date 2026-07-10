"use client";

import { Bell } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  indicatorId?: string;
  initialCount?: number;
  workspaceSlug: string;
}

export function NotificationBell({
  workspaceSlug,
  initialCount = 0,
  indicatorId,
}: NotificationBellProps) {
  const shouldReduceMotion = useReducedMotion();
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
      className={cn(
        "group relative flex cursor-pointer items-center gap-2.5 rounded-ir-sm px-3 py-2 text-sm transition-colors duration-150 ease-ir-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40",
        isActive
          ? "bg-ir-primary/15 font-medium text-ir-primary-light"
          : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground"
      )}
      href={`/${workspaceSlug}/notifications`}
    >
      {isActive && indicatorId && (
        <motion.span
          className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-ir-primary"
          layoutId={indicatorId}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { type: "spring", stiffness: 500, damping: 40 }
          }
        />
      )}
      <span className="relative shrink-0">
        <Bell className="size-4" weight={isActive ? "fill" : "regular"} />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              animate={{ scale: 1, opacity: 1 }}
              className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-ir-full bg-ir-danger px-0.5 text-2xs leading-none font-bold text-white"
              exit={shouldReduceMotion ? undefined : { scale: 0, opacity: 0 }}
              initial={shouldReduceMotion ? false : { scale: 0, opacity: 0 }}
              key={displayCount}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 500, damping: 25 }
              }
            >
              {displayCount}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      <span className="truncate">Notifications</span>
    </Link>
  );
}
