"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { ChangelogCommentData } from "./changelog-comment-types";

const QuillEditor = dynamic(
  () => import("@/components/comments/quill-editor"),
  {
    ssr: false,
  }
);

interface ChangelogCommentFormProps {
  changelogEntryId: string;
  isSignedIn: boolean;
  onSuccess: (comment: ChangelogCommentData) => void;
}

const MAX = 5000;

export function ChangelogCommentForm({
  changelogEntryId,
  isSignedIn,
  onSuccess,
}: ChangelogCommentFormProps) {
  const [html, setHtml] = useState("");
  const [text, setText] = useState("");
  const [editorKey, setEditorKey] = useState(0);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();

  function handleChange(newHtml: string, newText: string) {
    setHtml(newHtml);
    setText(newText);
    if (error) {
      setError(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || isPending) {
      return;
    }
    if (text.length > MAX) {
      setError(`Comment must be ${MAX.toLocaleString()} characters or fewer.`);
      return;
    }
    setError(null);
    setIsPending(true);

    try {
      const res = await fetch(`/api/changelog/${changelogEntryId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: html }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      onSuccess({
        ...data,
        createdAt: new Date(data.createdAt).toISOString(),
      });
      setEditorKey((k) => k + 1);
      setHtml("");
      setText("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  if (!isSignedIn) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        <Link
          className="font-medium text-primary hover:underline"
          href={`/signin?next=${encodeURIComponent(pathname)}`}
        >
          Sign in
        </Link>{" "}
        to join the conversation.
      </p>
    );
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <QuillEditor
        disabled={isPending}
        key={editorKey}
        minHeight={100}
        onChange={handleChange}
        placeholder="Leave a comment…"
        value={html}
      />

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {text.length > 0
            ? `${(MAX - text.length).toLocaleString()} characters remaining`
            : ""}
        </span>
        <button
          className="px-4 py-1.5 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          disabled={isPending || !text.trim()}
          type="submit"
        >
          {isPending ? "Posting…" : "Post comment"}
        </button>
      </div>
    </form>
  );
}
