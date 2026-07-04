"use client";

import { Bell, BellOff } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateNotificationPreferencesAction } from "@/app/actions/notifications";

interface SubscribeToggleProps {
  initialSubscribed: boolean;
}

// Unsubscribing here toggles the same global "Changelog updates" email
// preference shown in Notification Settings — it's the setting that actually
// gates whether changelog-published emails get sent, so this stays a single
// source of truth rather than a separate per-workspace follow mechanism.
export function SubscribeToggle({ initialSubscribed }: SubscribeToggleProps) {
  const [subscribed, setSubscribed] = useState(initialSubscribed);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next = !subscribed;
    startTransition(async () => {
      const result = await updateNotificationPreferencesAction({
        emailChangelog: next,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setSubscribed(next);
      toast.success(
        next ? "Subscribed to updates" : "Unsubscribed from updates"
      );
    });
  }

  return (
    <button
      className="flex items-center gap-1.5 border border-border px-3.5 py-2 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-muted disabled:opacity-50"
      disabled={isPending}
      onClick={toggle}
      type="button"
    >
      {subscribed ? (
        <>
          <BellOff className="size-4" />
          Unsubscribe from Updates
        </>
      ) : (
        <>
          <Bell className="size-4" />
          Subscribe to Updates
        </>
      )}
    </button>
  );
}
