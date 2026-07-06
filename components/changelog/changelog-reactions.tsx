"use client";

import { Smile } from "lucide-react";
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
    <div className="relative flex items-center gap-1 flex-wrap">
      {reactions.map((r) => (
        <button
          className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs border transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-60 ${
            r.hasReacted
              ? "border-primary/40 bg-primary/5 text-foreground"
              : "border-border bg-transparent text-foreground hover:border-muted-foreground/50"
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
            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            disabled={!!pendingEmoji}
            onClick={() => setShowPicker((v) => !v)}
            type="button"
          >
            <Smile className="size-3" />
          </button>

          {showPicker && (
            <>
              <button
                aria-label="Close emoji picker"
                className="fixed inset-0 z-10"
                onClick={() => setShowPicker(false)}
                type="button"
              />
              <div className="absolute left-0 bottom-full mb-1.5 z-20 flex gap-1 p-1.5 bg-background border border-border shadow-sm">
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    className="p-1 text-base hover:bg-muted transition-colors duration-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring leading-none"
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
