"use server";

import { getCurrentSession, requireSession } from "@/lib/authz";
import type { NotificationPreferencesRow } from "@/lib/notifications/queries";
import {
  getNotificationPreferences,
  upsertNotificationPreferences,
} from "@/lib/notifications/queries";

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string; code?: "UNAUTHENTICATED" };

export async function getNotificationPreferencesAction(): Promise<
  ActionResult<NotificationPreferencesRow>
> {
  const session = await requireSession();

  const prefs = await getNotificationPreferences(session.user.id);
  const defaults: NotificationPreferencesRow = {
    userId: session.user.id,
    emailStatusChange: true,
    emailNewComment: true,
    emailChangelog: true,
    inAppStatusChange: true,
    inAppNewComment: true,
    inAppChangelog: true,
    updatedAt: new Date(),
  };

  return { success: true, data: prefs ?? defaults };
}

export async function updateNotificationPreferencesAction(input: {
  emailStatusChange?: boolean;
  emailNewComment?: boolean;
  emailChangelog?: boolean;
  inAppStatusChange?: boolean;
  inAppNewComment?: boolean;
  inAppChangelog?: boolean;
}): Promise<ActionResult<NotificationPreferencesRow>> {
  // Uses getCurrentSession (not requireSession) — this is called from the
  // embed widget's SubscribeToggle too, where a stale/expired session must
  // surface as a normal error the caller can react to (reopening the
  // in-place sign-in), not a server-triggered redirect to /signin that would
  // navigate the whole iframe away.
  const session = await getCurrentSession();
  if (!session) {
    return {
      success: false,
      error: "Your session has expired. Please sign in again.",
      code: "UNAUTHENTICATED",
    };
  }

  try {
    const updated = await upsertNotificationPreferences(session.user.id, input);
    return { success: true, data: updated };
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Failed to update preferences.",
    };
  }
}
