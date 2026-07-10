"use client";

import { CheckIcon, LinkIcon, ShareNetworkIcon } from "@phosphor-icons/react";
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
      className="inline-flex items-center gap-1.5 rounded-ir-sm border border-ir-border px-3 py-1.5 text-xs font-medium text-ir-muted transition-colors duration-150 ease-ir-standard hover:border-ir-primary/30 hover:text-ir-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40"
      onClick={handleClick}
      type="button"
    >
      {copied ? (
        <>
          <CheckIcon className="size-3.5 text-ir-success" />
          Copied
        </>
      ) : canNativeShare ? (
        <>
          <ShareNetworkIcon className="size-3.5" />
          Share
        </>
      ) : (
        <>
          <LinkIcon className="size-3.5" />
          Copy link
        </>
      )}
    </button>
  );
}
