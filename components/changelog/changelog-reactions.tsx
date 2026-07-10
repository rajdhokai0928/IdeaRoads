"use client";

import { SmileyIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { REACTION_EMOJIS } from "@/config/platform";
import type { ReactionGroup } from "@/lib/changelog-comments/reactions";

interface ChangelogReactionsProps {
  changelogEntryId: string;
  initialReactions: ReactionGroup[];
  isSignedIn: boolean;
}

export function ChangelogReactions({
  changelogEntryId,
  initialReactions,
  isSignedIn,
}: ChangelogReactionsProps) {
  const [reactions, setReactions] = useState<ReactionGroup[]>(initialReactions);
  const [showPicker, setShowPicker] = useState(false);
  const [pendingEmoji, setPendingEmoji] = useState<string | null>(null);

  async function handleReact(emoji: string) {
    if (!isSignedIn || pendingEmoji) {
      return;
    }

    setPendingEmoji(emoji);
    setShowPicker(false);

    const existing = reactions.find((r) => r.emoji === emoji);
    if (existing) {
      if (existing.hasReacted) {
        setReactions((prev) =>
          prev
            .map((r) =>
              r.emoji === emoji
                ? { ...r, count: r.count - 1, hasReacted: false }
                : r
            )
            .filter((r) => r.count > 0)
        );
      } else {
        setReactions((prev) =>
          prev.map((r) =>
            r.emoji === emoji
              ? { ...r, count: r.count + 1, hasReacted: true }
              : r
          )
        );
      }
    } else {
      setReactions((prev) => [...prev, { emoji, count: 1, hasReacted: true }]);
    }

    try {
      await fetch(`/api/changelog/${changelogEntryId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
    } catch {
      setReactions(initialReactions);
    } finally {
      setPendingEmoji(null);
    }
  }

  return (
    <div className="relative flex flex-wrap items-center gap-1">
      {reactions.map((r) => (
        <button
          className={`inline-flex items-center gap-1 rounded-ir-sm border px-2 py-0.5 text-xs transition-colors duration-150 ease-ir-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40 disabled:opacity-60 ${
            r.hasReacted
              ? "border-ir-primary/40 bg-ir-primary-light/15 text-ir-heading"
              : "border-ir-border bg-transparent text-ir-heading hover:border-ir-primary/30"
          }`}
          disabled={!isSignedIn || !!pendingEmoji}
          key={r.emoji}
          onClick={() => handleReact(r.emoji)}
          type="button"
        >
          <span>{r.emoji}</span>
          <span className="tabular-nums">{r.count}</span>
        </button>
      ))}

      {isSignedIn && (
        <div className="relative">
          <button
            aria-label="Add reaction"
            className="inline-flex items-center gap-1 rounded-ir-sm border border-ir-border px-2 py-0.5 text-xs text-ir-muted transition-colors duration-150 ease-ir-standard hover:border-ir-primary/30 hover:text-ir-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40"
            disabled={!!pendingEmoji}
            onClick={() => setShowPicker((v) => !v)}
            type="button"
          >
            <SmileyIcon className="size-3" />
          </button>

          {showPicker && (
            <>
              <button
                aria-label="Close emoji picker"
                className="fixed inset-0 z-10"
                onClick={() => setShowPicker(false)}
                type="button"
              />
              <div className="absolute bottom-full left-0 z-20 mb-1.5 flex gap-1 rounded-ir-md border border-ir-border bg-ir-surface p-1.5 shadow-ir-md">
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    className="rounded-ir-xs p-1 text-base leading-none transition-colors duration-100 ease-ir-standard hover:bg-ir-muted-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40"
                    key={emoji}
                    onClick={() => handleReact(emoji)}
                    title={emoji}
                    type="button"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
