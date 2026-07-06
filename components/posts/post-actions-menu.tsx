"use client";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deletePostAction, updatePostAction } from "@/app/actions/posts";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PostActionsMenuProps {
  initialBody: string | null;
  initialTitle: string;
  postId: string;
  postTitle: string;
  workspaceId: string;
}

// Feedback-level actions (edit/delete the whole item), kept in a dedicated
// menu and clearly labelled "Feedback" so they can't be mistaken for the
// per-comment actions inside the comment thread on the detail page.
export function PostActionsMenu({
  postId,
  workspaceId,
  initialTitle,
  initialBody,
  postTitle,
}: PostActionsMenuProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody ?? "");
  const [error, setError] = useState<string | null>(null);

  function openEdit() {
    setTitle(initialTitle);
    setBody(initialBody ?? "");
    setError(null);
    setEditOpen(true);
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 3) {
      setError("Title must be at least 3 characters.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await updatePostAction({
        postId,
        workspaceId,
        title: title.trim(),
        body: body.trim() || undefined,
      });
      if (result.success) {
        toast.success("Feedback updated");
        setEditOpen(false);
        router.refresh();
      } else {
        setError(result.error ?? "Failed to update feedback.");
      }
    });
  }

  function handleDeleteConfirm() {
    startTransition(async () => {
      const result = await deletePostAction({ postId, workspaceId });
      if (result.success) {
        toast.success("Feedback deleted successfully");
        setDeleteOpen(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to delete feedback.");
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label="Feedback actions"
            className="flex size-7 items-center justify-center text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            type="button"
          >
            <MoreHorizontal className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={openEdit}>
            <Pencil />
            Edit Feedback
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={() => setDeleteOpen(true)}
          >
            <Trash2 />
            Delete Feedback
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog onOpenChange={setEditOpen} open={editOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit feedback</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleEditSubmit}>
            <div className="space-y-1.5">
              <label
                className="block text-xs font-medium text-foreground"
                htmlFor="post-actions-edit-title"
              >
                Title
              </label>
              <input
                className="w-full border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                id="post-actions-edit-title"
                maxLength={150}
                onChange={(e) => setTitle(e.target.value)}
                value={title}
              />
            </div>
            <div className="space-y-1.5">
              <label
                className="block text-xs font-medium text-foreground"
                htmlFor="post-actions-edit-body"
              >
                Description
              </label>
              <textarea
                className="min-h-32 w-full border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                id="post-actions-edit-body"
                maxLength={10_000}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Add more detail (optional)"
                value={body}
              />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <DialogFooter>
              <button
                className="px-3 py-1.5 text-xs text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                disabled={isPending}
                onClick={() => setEditOpen(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground transition-colors duration-150 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                disabled={isPending || !title.trim()}
                type="submit"
              >
                {isPending ? "Saving…" : "Save changes"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        confirmLabel="Delete Feedback"
        description={`Delete "${postTitle}"? This permanently removes the feedback item along with all of its comments and votes. This action cannot be undone.`}
        isPending={isPending}
        onConfirm={handleDeleteConfirm}
        onOpenChange={setDeleteOpen}
        open={deleteOpen}
        title="Delete Feedback"
      />
    </>
  );
}
