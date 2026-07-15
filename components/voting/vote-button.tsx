"use client";

import { CaretUpIcon } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { EmbedAuthDialog } from "@/components/embed/embed-auth-dialog";
import { useIsEmbed } from "@/components/embed/use-is-embed";

interface VoteButtonProps {
  // Smaller, borderless, label-less rendering for dense card/table layouts —
  // same voting behavior, just less chrome.
  compact?: boolean;
  initialCount: number;
  initialHasVoted: boolean;
  isArchived?: boolean;
  isLocked?: boolean;
  isSignedIn: boolean;
  postId: string;
}

export default function VoteButton({
  postId,
  initialCount,
  initialHasVoted,
  isSignedIn,
  isLocked = false,
  isArchived = false,
  compact = false,
}: VoteButtonProps) {
  const router = useRouter();
  const isEmbed = useIsEmbed();
  const shouldReduceMotion = useReducedMotion();
  const [count, setCount] = useState(initialCount);
  const [hasVoted, setHasVoted] = useState(initialHasVoted);
  const [isPending, setIsPending] = useState(false);
  const [signedIn, setSignedIn] = useState(isSignedIn);
  const [authOpen, setAuthOpen] = useState(false);

  // Another embedded element (comment box, feedback button) may complete
  // sign-in and call router.refresh() — that re-renders this component with
  // a new isSignedIn prop, but useState only reads its initial value once, so
  // sync it explicitly rather than staying stuck showing signed-out.
  useEffect(() => {
    if (isSignedIn) {
      setSignedIn(true);
    }
  }, [isSignedIn]);

  const disabled = isLocked || isArchived || isPending;
  const tooltip = isLocked
    ? "Voting is closed"
    : isArchived
      ? "This board is archived"
      : undefined;

  async function castVote() {
    const wasVoted = hasVoted;
    const prevCount = count;
    setHasVoted(!wasVoted);
    setCount(wasVoted ? Math.max(0, count - 1) : count + 1);
    setIsPending(true);

    try {
      const method = wasVoted ? "DELETE" : "POST";
      const res = await fetch(`/api/posts/${postId}/vote`, { method });

      if (!res.ok) {
        // Revert optimistic update
        setHasVoted(wasVoted);
        setCount(prevCount);
        // A session can go stale between page load and this click (expiry, a
        // sign-out elsewhere) — the local `signedIn` flag has no way to know
        // that on its own. Rather than leave the visitor stuck behind a
        // generic error until they manually reload, treat 401 as "actually
        // signed out" and reopen the in-place prompt right away.
        if (res.status === 401 && isEmbed) {
          setSignedIn(false);
          setAuthOpen(true);
          return;
        }
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Something went wrong.");
        return;
      }

      if (!wasVoted) {
        const data = await res.json().catch(() => ({}));
        if (typeof data.voteCount === "number") {
          setCount(data.voteCount);
        }
      }
    } catch {
      setHasVoted(wasVoted);
      setCount(prevCount);
      toast.error("Network error. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  function handleClick() {
    if (disabled) {
      return;
    }

    if (!signedIn) {
      if (isEmbed) {
        // Stay in the widget — sign in in place, then vote automatically.
        setAuthOpen(true);
        return;
      }
      // Voting requires sign-in — send the visitor to sign in, then back here.
      const next = encodeURIComponent(window.location.pathname);
      router.push(`/signin?next=${next}`);
      return;
    }

    castVote();
  }

  function handleAuthenticated() {
    setSignedIn(true);
    router.refresh();
    castVote();
  }

  const authDialog = isEmbed && (
    <EmbedAuthDialog
      onAuthenticated={handleAuthenticated}
      onOpenChange={setAuthOpen}
      open={authOpen}
    />
  );

  if (compact) {
    return (
      <>
        <motion.button
          aria-busy={isPending}
          aria-label={hasVoted ? "Remove vote" : "Vote for this post"}
          aria-pressed={hasVoted}
          className={`flex flex-col items-center gap-0.5 rounded-ir-sm px-2 py-1.5 transition-colors duration-150 ease-ir-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40 ${
            disabled && !isPending
              ? "cursor-not-allowed text-ir-muted opacity-50"
              : hasVoted
                ? "cursor-pointer bg-ir-primary-light/15 text-ir-primary hover:bg-ir-primary-light/25"
                : "cursor-pointer text-ir-muted hover:bg-ir-muted-surface hover:text-ir-heading"
          } ${isPending ? "opacity-70" : ""}`}
          disabled={disabled}
          onClick={handleClick}
          title={tooltip}
          type="button"
          whileTap={disabled || shouldReduceMotion ? undefined : { scale: 0.9 }}
        >
          <CaretUpIcon
            className="size-4"
            weight={hasVoted ? "bold" : "regular"}
          />
          <span className="text-xs font-semibold tabular-nums">{count}</span>
        </motion.button>
        {authDialog}
      </>
    );
  }

  return (
    <>
      <motion.button
        aria-busy={isPending}
        aria-label={hasVoted ? "Remove vote" : "Vote for this post"}
        aria-pressed={hasVoted}
        className={`flex flex-col items-center gap-0.5 rounded-ir-sm border px-2.5 py-1.5 transition-colors duration-150 ease-ir-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40 ${
          disabled && !isPending
            ? "cursor-not-allowed border-ir-border text-ir-muted opacity-50"
            : hasVoted
              ? "cursor-pointer border-ir-primary/40 bg-ir-primary-light/15 text-ir-primary hover:bg-ir-primary-light/25"
              : "cursor-pointer border-ir-border text-ir-muted hover:border-ir-primary/30 hover:text-ir-heading"
        } ${isPending ? "opacity-70" : ""}`}
        disabled={disabled}
        onClick={handleClick}
        title={tooltip}
        type="button"
        whileTap={disabled ? undefined : { scale: 0.9 }}
      >
        <CaretUpIcon
          className="size-4"
          weight={hasVoted ? "bold" : "regular"}
        />
        <span className="text-sm font-semibold tabular-nums">{count}</span>
      </motion.button>
      {authDialog}
    </>
  );
}
