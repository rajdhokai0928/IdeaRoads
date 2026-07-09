"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { truncateHtmlToText } from "@/lib/changelog/html";
import { uploadCommentImage } from "./upload-comment-image";
import type { CommentApi } from "./types";

const QuillEditor = dynamic(() => import("./quill-editor"), { ssr: false });

interface CommentEditFormProps {
  api?: CommentApi;
  commentId: string;
  initialBody: string;
  onCancel: () => void;
  onSaved: (newBody: string) => void;
}

// Inline editor for an existing comment. Reuses the shared Quill editor (image
// upload + Enter-to-save) and the comment API — only the author can edit, which
// the PATCH route enforces.
export default function CommentEditForm({
  api,
  commentId,
  initialBody,
  onSaved,
  onCancel,
}: CommentEditFormProps) {
  const commentBaseUrl = api?.commentBaseUrl ?? "/api/comments";
  const [html, setHtml] = useState(initialBody);
  // Seed the text length from the existing body so an unchanged comment is still
  // valid to save (the editor only emits onChange after a user edit).
  const [text, setText] = useState(() =>
    truncateHtmlToText(initialBody, 100_000)
  );
  const [isPending, setIsPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const htmlRef = useRef(initialBody);
  const textRef = useRef(truncateHtmlToText(initialBody, 100_000));

  const MAX = 5000;

  function handleChange(newHtml: string, newText: string) {
    setHtml(newHtml);
    setText(newText);
    htmlRef.current = newHtml;
    textRef.current = newText;
    if (error) {
      setError(null);
    }
  }

  async function submit() {
    const currentText = textRef.current;
    const currentHtml = htmlRef.current;
    if (!currentText.trim() || isPending || uploading) {
      return;
    }
    if (currentText.length > MAX) {
      setError(`Comment must be ${MAX.toLocaleString()} characters or fewer.`);
      return;
    }
    setError(null);
    setIsPending(true);
    try {
      const res = await fetch(`${commentBaseUrl}/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: currentHtml }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      onSaved(currentHtml);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="mt-1 space-y-2">
      <QuillEditor
        disabled={isPending}
        minHeight={72}
        onChange={handleChange}
        onSubmit={submit}
        onUploadingChange={setUploading}
        placeholder="Edit your comment…  (Enter to save, Shift+Enter for a new line)"
        uploadImage={uploadCommentImage}
        value={html}
      />

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex items-center justify-end gap-2">
        <button
          className="px-3 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          disabled={isPending}
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
        <button
          className="px-3 py-1 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          disabled={isPending || uploading || !text.trim()}
          onClick={submit}
          type="button"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
