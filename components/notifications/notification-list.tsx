"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { NotificationEmptyState } from "@/components/notifications/notification-empty-state";
import { NotificationItem } from "@/components/notifications/notification-item";
import { useNotificationsContext } from "@/components/notifications/notifications-context";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { NotificationListItem } from "@/lib/notifications/queries";
import { cn } from "@/lib/utils";

interface NotificationListProps {
  hasMore: boolean;
  initialItems: NotificationListItem[];
  total: number;
  workspaceId: string;
}

type FilterTab = "all" | "unread";

export function NotificationList({
  initialItems,
  hasMore: initialHasMore,
  total: initialTotal,
  workspaceId,
}: NotificationListProps) {
  const notificationsCtx = useNotificationsContext();
  const [items, setItems] = useState<NotificationListItem[]>(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [clearTarget, setClearTarget] = useState<NotificationListItem | null>(
    null
  );
  const [isClearingOne, setIsClearingOne] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleRead(id: string) {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }

  // Deleting a single notification is irreversible and easy to trigger by
  // mistake with a stray hover-click, so it's confirmed here rather than
  // removed the instant the row's icon is clicked.
  function handleConfirmClearOne() {
    if (!clearTarget) {
      return;
    }
    const target = clearTarget;
    setIsClearingOne(true);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/notifications/${target.id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          throw new Error("Failed to remove notification");
        }
        setItems((prev) => prev.filter((n) => n.id !== target.id));
        setTotal((prev) => Math.max(0, prev - 1));
        if (!target.isRead) {
          notificationsCtx?.decrementUnread(1);
        }
      } catch {
        toast.error("Failed to remove notification");
      } finally {
        setIsClearingOne(false);
        setClearTarget(null);
      }
    });
  }

  function handleMarkAllRead() {
    // Optimistic: flip every row to read and clear the shared badge right
    // away, then confirm with the server in the background. Roll back only
    // if the request actually fails — this is what keeps the count "always
    // synchronized" instead of waiting on the next poll or a page refresh.
    const previousItems = items;
    const previousUnread = notificationsCtx?.unreadCount;
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    notificationsCtx?.setUnreadCount(0);

    startTransition(async () => {
      try {
        const res = await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceId }),
        });
        if (!res.ok) {
          throw new Error("Failed to mark all notifications as read");
        }
        toast.success("All notifications marked as read");
      } catch {
        setItems(previousItems);
        if (previousUnread !== undefined) {
          notificationsCtx?.setUnreadCount(previousUnread);
        }
        toast.error("Failed to mark all as read");
      }
    });
  }

  function handleClearAll() {
    const previousItems = items;
    const previousTotal = total;
    const previousUnread = notificationsCtx?.unreadCount;

    // Optimistic: empty the list and badge immediately so the empty state
    // and sidebar count update on this click, not on the next round trip.
    setItems([]);
    setTotal(0);
    setHasMore(false);
    notificationsCtx?.setUnreadCount(0);
    setIsClearing(true);

    startTransition(async () => {
      try {
        const res = await fetch("/api/notifications", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceId }),
        });
        if (!res.ok) {
          throw new Error("Failed to clear notifications");
        }
        toast.success("All notifications cleared");
      } catch {
        setItems(previousItems);
        setTotal(previousTotal);
        setHasMore(initialHasMore);
        if (previousUnread !== undefined) {
          notificationsCtx?.setUnreadCount(previousUnread);
        }
        toast.error("Failed to clear notifications");
      } finally {
        setIsClearing(false);
        setClearConfirmOpen(false);
      }
    });
  }

  function handleLoadMore() {
    startTransition(async () => {
      try {
        const nextPage = page + 1;
        const res = await fetch(`/api/notifications?page=${nextPage}&limit=30`);
        if (!res.ok) {
          throw new Error("Failed to load more notifications");
        }
        const data = await res.json();
        setItems((prev) => [...prev, ...data.notifications]);
        setHasMore(data.hasMore);
        setPage(nextPage);
      } catch {
        toast.error("Failed to load more notifications");
      }
    });
  }

  const unreadCount = items.filter((n) => !n.isRead).length;
  const visibleItems =
    filter === "unread" ? items.filter((n) => !n.isRead) : items;

  // Group notifications by recency (Today / This week / Earlier). Items arrive
  // already sorted newest-first, so each group preserves that order.
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();
  const startOfWeek = startOfToday - 6 * 24 * 60 * 60 * 1000;
  const groups: { label: string; items: NotificationListItem[] }[] = [
    { label: "Today", items: [] },
    { label: "This week", items: [] },
    { label: "Earlier", items: [] },
  ];
  for (const n of visibleItems) {
    const t = new Date(n.createdAt).getTime();
    if (t >= startOfToday) {
      groups[0].items.push(n);
    } else if (t >= startOfWeek) {
      groups[1].items.push(n);
    } else {
      groups[2].items.push(n);
    }
  }
  const visibleGroups = groups.filter((g) => g.items.length > 0);

  return (
    <div>
      {/* Header + toolbar stick together as one unit while the list scrolls
          beneath them. */}
      <div className="sticky top-0 z-10 bg-background">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              Notifications
            </h1>
            {total > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {total} notification{total === 1 ? "" : "s"}
                {unreadCount > 0 && (
                  <span className="ml-1.5 text-primary font-medium">
                    · {unreadCount} unread
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Toolbar: filter tabs + bulk actions */}
        {items.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-border">
            <div className="flex items-center gap-1 rounded-md bg-muted/50 p-0.5">
              <button
                className={cn(
                  "rounded-sm px-2.5 py-1 text-xs font-medium transition-colors",
                  filter === "all"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setFilter("all")}
                type="button"
              >
                All
              </button>
              <button
                className={cn(
                  "flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-medium transition-colors",
                  filter === "unread"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setFilter("unread")}
                type="button"
              >
                Unread
                {unreadCount > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary/15 px-1 text-2xs font-semibold text-primary">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            <div className="flex items-center gap-4">
              {unreadCount > 0 && (
                <button
                  className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                  disabled={isPending}
                  onClick={handleMarkAllRead}
                  type="button"
                >
                  Mark all as read
                </button>
              )}
              <button
                className="text-xs font-medium text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                disabled={isPending}
                onClick={() => setClearConfirmOpen(true)}
                type="button"
              >
                Clear all
              </button>
            </div>
          </div>
        )}
      </div>

      {/* List */}
      {items.length === 0 ? (
        <NotificationEmptyState />
      ) : visibleGroups.length === 0 ? (
        <div className="px-5 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            You're all caught up — no unread notifications.
          </p>
        </div>
      ) : (
        <div>
          {visibleGroups.map((group) => (
            <div key={group.label}>
              <p className="px-5 pt-4 pb-1.5 text-2xs font-semibold uppercase tracking-eyebrow text-muted-foreground/60">
                {group.label}
              </p>
              {group.items.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={handleRead}
                  onRequestClear={setClearTarget}
                />
              ))}
            </div>
          ))}

          {hasMore && filter === "all" && (
            <div className="px-5 py-4 text-center">
              <button
                className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                disabled={isPending}
                onClick={handleLoadMore}
                type="button"
              >
                {isPending ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        confirmLabel="Clear All"
        description={`Remove all ${total} notification${total === 1 ? "" : "s"}? This cannot be undone.`}
        isPending={isClearing}
        onConfirm={handleClearAll}
        onOpenChange={setClearConfirmOpen}
        open={clearConfirmOpen}
        title="Clear all notifications"
        variant="destructive"
      />

      <ConfirmDialog
        confirmLabel="Remove"
        description={`Remove "${clearTarget?.title}"? This cannot be undone.`}
        isPending={isClearingOne}
        onConfirm={handleConfirmClearOne}
        onOpenChange={(open) => !open && setClearTarget(null)}
        open={!!clearTarget}
        title="Remove notification"
        variant="destructive"
      />
    </div>
  );
}
