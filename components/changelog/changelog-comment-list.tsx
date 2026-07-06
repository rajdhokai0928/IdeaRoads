"use client";

import { useState } from "react";
import { ChangelogCommentForm } from "./changelog-comment-form";
import { ChangelogCommentItem } from "./changelog-comment-item";
import type { ChangelogCommentData } from "./changelog-comment-types";

interface ChangelogCommentListProps {
  changelogEntryId: string;
  currentUserId: string | null;
  initialComments: ChangelogCommentData[];
  isMember: boolean;
  isSignedIn: boolean;
}

export function ChangelogCommentList({
  changelogEntryId,
  initialComments,
  isSignedIn,
  currentUserId,
  isMember,
}: ChangelogCommentListProps) {
  const [comments, setComments] = useState<ChangelogCommentData[]>(
    initialComments.filter((c) => !c.isDeleted)
  );

  function handleAdded(comment: ChangelogCommentData) {
    setComments((prev) => [...prev, comment]);
  }

  function handleDeleted(commentId: string) {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  }

  return (
    <div className="space-y-0">
      {comments.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 border-b border-border">
          No comments yet. Be the first to share your thoughts.
        </p>
      ) : (
        <div>
          {comments.map((comment) => (
            <ChangelogCommentItem
              canDelete={isMember || comment.authorId === currentUserId}
              comment={comment}
              key={comment.id}
              onDelete={() => handleDeleted(comment.id)}
            />
          ))}
        </div>
      )}

      <div className="pt-6 mt-2 border-t border-border">
        <ChangelogCommentForm
          changelogEntryId={changelogEntryId}
          isSignedIn={isSignedIn}
          onSuccess={handleAdded}
        />
      </div>
    </div>
  );
}
