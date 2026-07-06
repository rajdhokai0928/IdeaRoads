"use client";

import { formatDistanceToNow } from "date-fns";
import DOMPurify from "isomorphic-dompurify";
import { Trash2, UserRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { ChangelogCommentData } from "./changelog-comment-types";

interface ChangelogCommentItemProps {
  canDelete: boolean;
  comment: ChangelogCommentData;
  onDelete: () => void;
}

export function ChangelogCommentItem({
  comment,
  canDelete,
  onDelete,
}: ChangelogCommentItemProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const displayName = comment.authorName ?? "User";

  async function handleConfirmDelete() {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/changelog/comments/${comment.id}`, {
        method: "DELETE",
      });
      if (res.ok || res.status === 204) {
        setShowDeleteDialog(false);
        onDelete();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Failed to delete comment.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <div className="flex gap-3 py-3.5 border-b border-border last:border-0">
        <div className="size-7 shrink-0 flex items-center justify-center bg-muted text-muted-foreground">
          <UserRound className="size-3.5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-xs font-medium text-foreground">
              {displayName}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>

          <div
            className="mt-1 text-sm leading-relaxed text-foreground wrap-break-word"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized below
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(comment.body),
            }}
          />

          {canDelete && (
            <div className="mt-2">
              <button
                aria-label="Delete comment"
                className="inline-flex items-center gap-1 text-xs text-destructive hover:opacity-70 transition-opacity duration-150 focus-visible:outline-none"
                onClick={() => setShowDeleteDialog(true)}
                type="button"
              >
                <Trash2 className="size-3" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        confirmLabel="Delete"
        description="Are you sure you want to delete this comment? This action cannot be undone."
        isPending={isDeleting}
        onConfirm={handleConfirmDelete}
        onOpenChange={setShowDeleteDialog}
        open={showDeleteDialog}
        title="Delete Comment"
      />
    </>
  );
}
