"use client";

import { BellIcon, BellSlashIcon } from "@phosphor-icons/react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateNotificationPreferencesAction } from "@/app/actions/notifications";
import { Button } from "@/components/ui/button";

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
    <Button disabled={isPending} onClick={toggle} size="sm" variant="outline">
      {subscribed ? (
        <>
          <BellSlashIcon data-icon="inline-start" />
          Unsubscribe from Updates
        </>
      ) : (
        <>
          <BellIcon data-icon="inline-start" />
          Subscribe to Updates
        </>
      )}
    </Button>
  );
}
