"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { EmbedAuthDialog } from "@/components/embed/embed-auth-dialog";
import { useIsEmbed } from "@/components/embed/use-is-embed";
import { Button } from "@/components/ui/button";
import { type CommentApi, postsCommentApi, type ReplyData } from "./types";
import { uploadCommentImage } from "./upload-comment-image";

const QuillEditor = dynamic(() => import("./quill-editor"), { ssr: false });

interface CommentReplyFormProps {
  api?: CommentApi;
  isSignedIn: boolean;
  onCancel: () => void;
  onSuccess: (reply: ReplyData) => void;
  parentId: string;
  postId: string;
}

export default function CommentReplyForm({
  postId,
  api,
  parentId,
  isSignedIn,
  onSuccess,
  onCancel,
}: CommentReplyFormProps) {
  const createUrl = (api ?? postsCommentApi(postId)).createUrl;
  const router = useRouter();
  const isEmbed = useIsEmbed();
  const [html, setHtml] = useState("");
  const [text, setText] = useState("");
  const [editorKey, setEditorKey] = useState(0);
  const [isPending, setIsPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(isSignedIn);
  const [authOpen, setAuthOpen] = useState(false);
  const pathname = usePathname();

  // Another embedded element may complete sign-in and call router.refresh()
  // — that re-renders this component with a new isSignedIn prop, but
  // useState only reads its initial value once, so sync it explicitly rather
  // than staying stuck showing signed-out.
  useEffect(() => {
    if (isSignedIn) {
      setSignedIn(true);
    }
  }, [isSignedIn]);

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
    if (!currentText.trim() || isPending || uploading) {
      return;
    }
    if (currentText.length > MAX) {
      setError(`Reply must be ${MAX.toLocaleString()} characters or fewer.`);
      return;
    }
    setError(null);
    setPendingMessage(null);
    setIsPending(true);

    try {
      const res = await fetch(createUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: currentHtml,
          parentId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      if (!data.isApproved) {
        setPendingMessage("Your reply is pending review by an admin.");
        resetEditor();
        return;
      }

      resetEditor();
      onSuccess({
        ...data,
        createdAt: new Date(data.createdAt).toISOString(),
        reactions: [],
      });
      onCancel();
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

  if (!signedIn) {
    return (
      <>
        <p className="mt-3 ml-10 py-2 text-sm text-ir-muted">
          {isEmbed ? (
            <button
              className="font-medium text-ir-primary hover:underline"
              onClick={() => setAuthOpen(true)}
              type="button"
            >
              Sign in
            </button>
          ) : (
            <Link
              className="font-medium text-ir-primary hover:underline"
              href={`/signin?next=${encodeURIComponent(pathname)}`}
            >
              Sign in
            </Link>
          )}{" "}
          to reply.{" "}
          <button
            className="text-ir-muted transition-colors duration-150 ease-ir-standard hover:text-ir-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40"
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
        </p>
        {isEmbed && (
          <EmbedAuthDialog
            onAuthenticated={() => {
              setSignedIn(true);
              router.refresh();
            }}
            onOpenChange={setAuthOpen}
            open={authOpen}
          />
        )}
      </>
    );
  }

  return (
    <form className="mt-3 ml-10 space-y-2" onSubmit={handleSubmit}>
      <QuillEditor
        disabled={isPending}
        key={editorKey}
        minHeight={72}
        onChange={handleChange}
        onSubmit={submit}
        onUploadingChange={setUploading}
        placeholder="Write a reply…  (Enter to reply, Shift+Enter for a new line)"
        uploadImage={uploadCommentImage}
        value={html}
      />

      {error && <p className="text-xs text-ir-danger">{error}</p>}
      {pendingMessage && (
        <p className="text-xs text-ir-warning">{pendingMessage}</p>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button
          disabled={isPending}
          onClick={onCancel}
          size="sm"
          type="button"
          variant="ghost"
        >
          Cancel
        </Button>
        <Button
          disabled={isPending || uploading || !text.trim()}
          size="sm"
          type="submit"
        >
          {isPending ? "Posting…" : "Reply"}
        </Button>
      </div>
    </form>
  );
}
