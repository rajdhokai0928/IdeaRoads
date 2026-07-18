"use client";

import { formatDistanceToNow } from "date-fns";
import {
  ArrowRight,
  Bell,
  CornerDownRight,
  FileText,
  MailOpen,
  Megaphone,
  MessageCircle,
  Trash2,
  UserCheck,
  UserPlus,
  UserX,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useNotificationsContext } from "@/components/notifications/notifications-context";
import type { NotificationType } from "@/db/schema/notifications";
import type { NotificationListItem } from "@/lib/notifications/queries";

const TYPE_ICONS: Record<NotificationType, React.ElementType> = {
  new_post: FileText,
  status_change: ArrowRight,
  new_comment: MessageCircle,
  reply: CornerDownRight,
  invite_accepted: UserCheck,
  member_removed: UserX,
  changelog_published: Megaphone,
  assignment: UserPlus,
};

const REMOVED_MESSAGE =
  "This item is no longer available because it has been removed.";

interface NotificationItemProps {
  notification: NotificationListItem;
  onRead: (id: string) => void;
  onRequestClear: (notification: NotificationListItem) => void;
}

export function NotificationItem({
  notification,
  onRead,
  onRequestClear,
}: NotificationItemProps) {
  const Icon = TYPE_ICONS[notification.type as NotificationType] ?? Bell;
  const isRead = notification.isRead;
  const isRemoved = notification.targetMissing;
  const notificationsCtx = useNotificationsContext();

  // Marks read without navigating (used by both opening the notification and
  // the hover "mark as read" action). Decrementing the shared context here —
  // not just the list's local state — is what makes the sidebar bell update
  // on the same click instead of the next poll.
  function markRead() {
    if (!isRead) {
      onRead(notification.id);
      notificationsCtx?.decrementUnread(1);
      fetch(`/api/notifications/${notification.id}`, {
        method: "PATCH",
      }).catch(() => {
        // best-effort; the list already reflects the optimistic update
      });
    }
  }

  function handleRemovedClick() {
    markRead();
    toast(REMOVED_MESSAGE);
  }

  // Only opens the confirmation dialog (owned by NotificationList) — the
  // actual delete happens on confirm, so a mis-click can't silently disappear
  // a notification with no way to know where it went.
  function handleRequestClear(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    onRequestClear(notification);
  }

  function handleMarkReadClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    markRead();
  }

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
  });

  return (
    <div
      className={`group relative flex w-full items-start gap-3 px-5 py-3.5 border-b border-border transition-colors hover:bg-muted/40 ${
        isRead ? "" : "bg-primary/5"
      }`}
    >
      {/* Unread indicator */}
      <span className="mt-1 shrink-0 flex items-center justify-center size-4">
        {isRead ? (
          <span className="size-2 rounded-full bg-transparent" />
        ) : (
          <span className="size-2 rounded-full bg-primary" />
        )}
      </span>

      {/* Icon */}
      <span
        className={`mt-0.5 shrink-0 flex size-7 items-center justify-center rounded-ir-sm ${
          isRemoved
            ? "bg-muted/60 text-muted-foreground/60"
            : "bg-muted text-muted-foreground"
        }`}
      >
        <Icon className="size-3.5" />
      </span>

      {/* Content — the title itself is the single real navigation target,
          stretched via ::after to cover the whole row so the entire row
          stays clickable without nesting interactive elements. */}
      <div className="flex-1 min-w-0 pr-14">
        <div className="flex items-start gap-2">
          {isRemoved ? (
            <button
              className="text-left text-sm leading-snug text-muted-foreground after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
              onClick={handleRemovedClick}
              type="button"
            >
              {notification.title}
            </button>
          ) : (
            <Link
              className={`text-sm leading-snug after:absolute after:inset-0 after:content-[''] focus-visible:outline-none ${
                isRead
                  ? "font-normal text-muted-foreground"
                  : "font-semibold text-foreground"
              }`}
              href={notification.link}
              onClick={markRead}
            >
              {notification.title}
            </Link>
          )}
          {isRemoved && (
            <span className="mt-0.5 shrink-0 rounded-full bg-muted px-2 py-0.5 text-2xs font-medium uppercase tracking-wide text-muted-foreground">
              Removed
            </span>
          )}
        </div>
        {notification.body && !isRemoved && (
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
            {notification.body}
          </p>
        )}
        {isRemoved && (
          <p className="mt-0.5 text-xs text-muted-foreground/70">
            {REMOVED_MESSAGE}
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground/60">{timeAgo}</p>
      </div>

      {/* Hover actions — Gmail-style: mark as read (unread only) + clear,
          layered above the stretched title link so they stay clickable. */}
      <div className="absolute right-4 top-3.5 z-10 hidden items-center gap-1 group-hover:flex">
        {!isRead && !isRemoved && (
          <button
            aria-label="Mark as read"
            className="flex size-7 items-center justify-center rounded-ir-sm text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={handleMarkReadClick}
            title="Mark as read"
            type="button"
          >
            <MailOpen className="size-3.5" />
          </button>
        )}
        <button
          aria-label="Remove notification"
          className="flex size-7 items-center justify-center rounded-ir-sm text-muted-foreground transition-colors hover:bg-background hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={handleRequestClear}
          title="Remove notification"
          type="button"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
