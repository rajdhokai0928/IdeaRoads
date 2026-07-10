"use client";

import { CaretUpIcon } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

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
  const shouldReduceMotion = useReducedMotion();
  const [count, setCount] = useState(initialCount);
  const [hasVoted, setHasVoted] = useState(initialHasVoted);
  const [isPending, setIsPending] = useState(false);

  const disabled = isLocked || isArchived || isPending;
  const tooltip = isLocked
    ? "Voting is closed"
    : isArchived
      ? "This board is archived"
      : undefined;

  async function handleClick() {
    if (disabled) {
      return;
    }

    if (!isSignedIn) {
      // Voting requires sign-in — send the visitor to sign in, then back here.
      const next = encodeURIComponent(window.location.pathname);
      router.push(`/signin?next=${next}`);
      return;
    }

    // Optimistic update
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

  if (compact) {
    return (
      <motion.button
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
    );
  }

  return (
    <motion.button
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
      <CaretUpIcon className="size-4" weight={hasVoted ? "bold" : "regular"} />
      <span className="text-sm font-semibold tabular-nums">{count}</span>
    </motion.button>
  );
}
