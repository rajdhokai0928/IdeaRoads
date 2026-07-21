"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import CommentForm from "./comment-form";
import CommentItem from "./comment-item";
import CommentReplyForm from "./comment-reply-form";
import type { CommentApi, CommentData, ReplyData } from "./types";

interface CommentThreadProps {
  api?: CommentApi;
  canModerate: boolean;
  initialComments: CommentData[];
  isLocked: boolean;
  isSignedIn: boolean;
  postId: string;
}

interface ThreadState {
  comment: CommentData;
  replies: ReplyData[];
  showReplyForm: boolean;
}

export default function CommentThread({
  api,
  initialComments,
  postId,
  isSignedIn,
  isLocked,
  canModerate,
}: CommentThreadProps) {
  const shouldReduceMotion = useReducedMotion();
  const [threads, setThreads] = useState<ThreadState[]>(() =>
    initialComments.map((c) => ({
      comment: c,
      showReplyForm: false,
      replies: c.replies,
    }))
  );

  function handleCommentAdded(newComment: CommentData) {
    setThreads((prev) => [
      ...prev,
      { comment: newComment, showReplyForm: false, replies: [] },
    ]);
  }

  function handleReplyAdded(parentId: string, reply: ReplyData) {
    setThreads((prev) =>
      prev.map((t) =>
        t.comment.id === parentId
          ? { ...t, replies: [...t.replies, reply], showReplyForm: false }
          : t
      )
    );
  }

  function toggleReplyForm(commentId: string) {
    setThreads((prev) =>
      prev.map((t) =>
        t.comment.id === commentId
          ? { ...t, showReplyForm: !t.showReplyForm }
          : { ...t, showReplyForm: false }
      )
    );
  }

  function handleDeleteTopLevel(commentId: string) {
    // Hard delete — remove from UI entirely regardless of replies
    setThreads((prev) => prev.filter((t) => t.comment.id !== commentId));
  }

  function handleDeleteReply(parentId: string, replyId: string) {
    setThreads((prev) =>
      prev.map((t) =>
        t.comment.id === parentId
          ? {
              ...t,
              replies: t.replies.filter((r) => r.id !== replyId),
            }
          : t
      )
    );
  }

  const approvedThreads = threads.filter(
    (t) => t.comment.isApproved || canModerate
  );

  if (approvedThreads.length === 0 && !isLocked) {
    return (
      <div className="space-y-0">
        <p className="border-b border-ir-border py-4 text-xs text-ir-muted">
          No comments yet. Be the first to share your thoughts.
        </p>
        <div className="pt-6">
          <CommentForm
            api={api}
            isLocked={isLocked}
            isSignedIn={isSignedIn}
            onSuccess={handleCommentAdded}
            postId={postId}
          />
        </div>
      </div>
    );
  }

  if (approvedThreads.length === 0 && isLocked) {
    return (
      <p className="py-4 text-xs text-ir-muted">
        No comments. Comments are closed on this post.
      </p>
    );
  }

  return (
    <div className="space-y-0">
      {/* Comment threads */}
      <div>
        {approvedThreads.map((thread) => (
          <div key={thread.comment.id}>
            <CommentItem
              api={api}
              canModerate={canModerate}
              comment={thread.comment}
              depth={0}
              isLocked={isLocked}
              isReplyOpen={thread.showReplyForm}
              isSignedIn={isSignedIn}
              onDelete={() => handleDeleteTopLevel(thread.comment.id)}
              onReply={
                isLocked ? undefined : () => toggleReplyForm(thread.comment.id)
              }
            />

            {/* Replies */}
            {thread.replies.length > 0 && (
              <div className="mb-2 ml-10 border-l border-ir-border pl-4">
                {thread.replies
                  .filter((r) => r.isApproved || canModerate)
                  .map((reply) => (
                    <CommentItem
                      api={api}
                      canModerate={canModerate}
                      comment={reply}
                      depth={1}
                      isLocked={isLocked}
                      isSignedIn={isSignedIn}
                      key={reply.id}
                      onDelete={() =>
                        handleDeleteReply(thread.comment.id, reply.id)
                      }
                    />
                  ))}
              </div>
            )}

            {/* Inline reply form */}
            <AnimatePresence>
              {thread.showReplyForm && (
                <motion.div
                  animate={{ height: "auto", opacity: 1 }}
                  exit={
                    shouldReduceMotion ? undefined : { height: 0, opacity: 0 }
                  }
                  initial={
                    shouldReduceMotion ? false : { height: 0, opacity: 0 }
                  }
                  style={{ overflow: "hidden" }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                >
                  <CommentReplyForm
                    api={api}
                    isSignedIn={isSignedIn}
                    onCancel={() => toggleReplyForm(thread.comment.id)}
                    onSuccess={(reply) =>
                      handleReplyAdded(thread.comment.id, reply)
                    }
                    parentId={thread.comment.id}
                    postId={postId}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* New comment form */}
      {!isLocked && (
        <div className="mt-2 border-t border-ir-border pt-6">
          <CommentForm
            api={api}
            isLocked={isLocked}
            isSignedIn={isSignedIn}
            onSuccess={handleCommentAdded}
            postId={postId}
          />
        </div>
      )}
    </div>
  );
}
