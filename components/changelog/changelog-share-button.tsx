"use client";

import { Check, Link2, Share2 } from "lucide-react";
import { useState } from "react";

interface ChangelogShareButtonProps {
  title: string;
  url: string;
}

export function ChangelogShareButton({
  title,
  url,
}: ChangelogShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const canNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  async function handleClick() {
    if (canNativeShare) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // User cancelled or share failed — fall through to copy.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access denied — nothing further we can do.
    }
  }

  return (
    <button
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={handleClick}
      type="button"
    >
      {copied ? (
        <>
          <Check className="size-3.5 text-success" />
          Copied
        </>
      ) : canNativeShare ? (
        <>
          <Share2 className="size-3.5" />
          Share
        </>
      ) : (
        <>
          <Link2 className="size-3.5" />
          Copy link
        </>
      )}
    </button>
  );
}
