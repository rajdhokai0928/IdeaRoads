"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { type CommentApi, type CommentData, postsCommentApi } from "./types";
import { uploadCommentImage } from "./upload-comment-image";

const QuillEditor = dynamic(() => import("./quill-editor"), { ssr: false });

interface CommentFormProps {
  api?: CommentApi;
  isLocked: boolean;
  isSignedIn: boolean;
  onSuccess: (comment: CommentData) => void;
  postId: string;
}

export default function CommentForm({
  postId,
  api,
  isSignedIn,
  isLocked,
  onSuccess,
}: CommentFormProps) {
  const createUrl = (api ?? postsCommentApi(postId)).createUrl;
  const [html, setHtml] = useState("");
  const [text, setText] = useState("");
  const [editorKey, setEditorKey] = useState(0);
  const [isPending, setIsPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const pathname = usePathname();

  // Mirrors of the latest content so the Enter-to-submit handler always reads
  // the current value (not a stale render's state).
  const htmlRef = useRef("");
  const textRef = useRef("");

  const MAX = 5000;

  function handleChange(newHtml: string, newText: string) {
    setHtml(newHtml);
    setText(newText);
    htmlRef.current = newHtml;
    textRef.current = newText;
    if (error) {
      setError(null);
    }
    if (pendingMessage) {
      setPendingMessage(null);
    }
  }

  function resetEditor() {
    setEditorKey((k) => k + 1);
    setHtml("");
    setText("");
    htmlRef.current = "";
    textRef.current = "";
  }

  async function submit() {
    const currentText = textRef.current;
    const currentHtml = htmlRef.current;
    // Validation + duplicate-submit / mid-upload guards.
    if (!currentText.trim() || isPending || uploading) {
      return;
    }
    if (currentText.length > MAX) {
      setError(`Comment must be ${MAX.toLocaleString()} characters or fewer.`);
      return;
    }
    setError(null);
    setPendingMessage(null);
    setIsPending(true);

    try {
      const res = await fetch(createUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: currentHtml }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      if (!data.isApproved) {
        setPendingMessage("Your comment is pending review by an admin.");
        resetEditor();
        return;
      }

      onSuccess({
        ...data,
        createdAt: new Date(data.createdAt).toISOString(),
        reactions: [],
        replies: [],
      });
      resetEditor();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submit();
  }

  if (isLocked) {
    return (
      <p className="py-2 text-xs text-ir-muted">
        Comments are closed on this post.
      </p>
    );
  }

  if (!isSignedIn) {
    return (
      <p className="py-2 text-sm text-ir-muted">
        <Link
          className="font-medium text-ir-primary hover:underline"
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
        onSubmit={submit}
        onUploadingChange={setUploading}
        placeholder="Leave a comment…  (Enter to post, Shift+Enter for a new line)"
        uploadImage={uploadCommentImage}
        value={html}
      />

      {error && <p className="text-xs text-ir-danger">{error}</p>}
      {pendingMessage && (
        <p className="text-xs text-ir-warning">{pendingMessage}</p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-ir-muted">
          {text.length > 0
            ? `${(MAX - text.length).toLocaleString()} characters remaining`
            : ""}
        </span>
        <Button
          disabled={isPending || uploading || !text.trim()}
          size="sm"
          type="submit"
        >
          {isPending ? "Posting…" : "Post comment"}
        </Button>
      </div>
    </form>
  );
}
