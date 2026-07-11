"use client";

import { formatDistanceToNow } from "date-fns";
import {
  ArrowRight,
  Bell,
  CornerDownRight,
  FileText,
  Megaphone,
  MessageCircle,
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
}

export function NotificationItem({
  notification,
  onRead,
}: NotificationItemProps) {
  const Icon = TYPE_ICONS[notification.type as NotificationType] ?? Bell;
  const isRead = notification.isRead;
  const isRemoved = notification.targetMissing;
  const notificationsCtx = useNotificationsContext();

  // Opening a notification always marks it read (persisted best-effort so the
  // badge/count stay in sync even after navigating away). Decrementing the
  // shared context here — not just the list's local state — is what makes
  // the sidebar bell update on the same click instead of the next poll.
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

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
  });

  const rowClass = `flex w-full items-start gap-3 px-5 py-3.5 border-b border-border text-left transition-colors hover:bg-muted/40 ${
    isRead ? "" : "bg-primary/5"
  }`;

  const content = (
    <>
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
        className={`mt-0.5 shrink-0 flex size-7 items-center justify-center ${
          isRemoved
            ? "bg-muted/60 text-muted-foreground/60"
            : "bg-muted text-muted-foreground"
        }`}
      >
        <Icon className="size-3.5" />
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <p
            className={`text-sm leading-snug ${
              isRemoved
                ? "text-muted-foreground"
                : isRead
                  ? "font-normal text-muted-foreground"
                  : "font-semibold text-foreground"
            }`}
          >
            {notification.title}
          </p>
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
    </>
  );

  // Deleted resource: never route the user into a 404 — mark read and explain
  // inline instead of navigating.
  if (isRemoved) {
    return (
      <button className={rowClass} onClick={handleRemovedClick} type="button">
        {content}
      </button>
    );
  }

  return (
    <Link className={rowClass} href={notification.link} onClick={markRead}>
      {content}
    </Link>
  );
}
