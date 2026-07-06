"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

interface ApiKeyCodeBlockProps {
  code: string;
}

export function ApiKeyCodeBlock({ code }: ApiKeyCodeBlockProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="relative border border-border bg-muted/40">
      <pre className="overflow-x-auto p-3 pr-10 text-xs leading-relaxed text-foreground">
        <code>{code}</code>
      </pre>
      <button
        aria-label="Copy code"
        className="absolute right-2 top-2 flex size-6 items-center justify-center text-muted-foreground hover:text-foreground transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={handleCopy}
        type="button"
      >
        {copied ? (
          <Check className="size-3.5 text-success" />
        ) : (
          <Copy className="size-3.5" />
        )}
      </button>
    </div>
  );
}
