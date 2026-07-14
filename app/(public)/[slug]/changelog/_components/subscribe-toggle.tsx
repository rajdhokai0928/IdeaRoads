"use client";

import { BellIcon, BellSlashIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { updateNotificationPreferencesAction } from "@/app/actions/notifications";
import { EmbedAuthDialog } from "@/components/embed/embed-auth-dialog";
import { useIsEmbed } from "@/components/embed/use-is-embed";
import { Button } from "@/components/ui/button";

interface SubscribeToggleProps {
  initialSubscribed: boolean;
  isSignedIn: boolean;
}

// Unsubscribing here toggles the same global "Changelog updates" email
// preference shown in Notification Settings — it's the setting that actually
// gates whether changelog-published emails get sent, so this stays a single
// source of truth rather than a separate per-workspace follow mechanism.
export function SubscribeToggle({
  initialSubscribed,
  isSignedIn,
}: SubscribeToggleProps) {
  const router = useRouter();
  const isEmbed = useIsEmbed();
  const [subscribed, setSubscribed] = useState(initialSubscribed);
  const [signedIn, setSignedIn] = useState(isSignedIn);
  const [authOpen, setAuthOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (isSignedIn) {
      setSignedIn(true);
    }
  }, [isSignedIn]);

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

  if (!signedIn) {
    // Outside the embed, this stays hidden until signed in — unchanged from
    // the existing Public Portal behavior.
    if (!isEmbed) {
      return null;
    }
    return (
      <>
        <Button onClick={() => setAuthOpen(true)} size="sm" variant="outline">
          <BellIcon data-icon="inline-start" />
          Subscribe to Updates
        </Button>
        <EmbedAuthDialog
          onAuthenticated={() => {
            setSignedIn(true);
            router.refresh();
          }}
          onOpenChange={setAuthOpen}
          open={authOpen}
        />
      </>
    );
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
