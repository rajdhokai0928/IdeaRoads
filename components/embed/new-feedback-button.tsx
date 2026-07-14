"use client";

import { PlusIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EmbedAuthDialog } from "./embed-auth-dialog";
import { useIsEmbed } from "./use-is-embed";

interface NewFeedbackButtonProps {
  // Either the direct new-post path (signed in) or `/signin?next=<path>`
  // (signed out) — same shape the non-embed sidebar has always used.
  href: string;
}

const SIGNIN_PREFIX = "/signin?next=";

// "+ Feedback" trigger for the board sidebar. Outside the embed it's a plain
// link, same as always. Inside the embed, a signed-out click opens the
// in-place auth dialog instead of navigating to /signin, then continues on
// to the new-post form once signed in — the widget never leaves the page.
export function NewFeedbackButton({ href }: NewFeedbackButtonProps) {
  const isEmbed = useIsEmbed();
  const router = useRouter();
  const [authOpen, setAuthOpen] = useState(false);

  const needsSignIn = href.startsWith(SIGNIN_PREFIX);
  const target = needsSignIn
    ? decodeURIComponent(href.slice(SIGNIN_PREFIX.length))
    : href;

  if (!isEmbed || !needsSignIn) {
    return (
      <Button asChild className="w-full">
        <Link href={href}>
          <PlusIcon data-icon="inline-start" />
          Feedback
        </Link>
      </Button>
    );
  }

  return (
    <>
      <Button
        className="w-full"
        onClick={() => setAuthOpen(true)}
        type="button"
      >
        <PlusIcon data-icon="inline-start" />
        Feedback
      </Button>
      <EmbedAuthDialog
        onAuthenticated={() => router.push(target)}
        onOpenChange={setAuthOpen}
        open={authOpen}
      />
    </>
  );
}
