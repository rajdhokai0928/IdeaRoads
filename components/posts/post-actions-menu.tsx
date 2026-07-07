"use client";

import {
  Copy,
  GitMerge,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  Send,
  Trash2,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  deletePostAction,
  duplicatePostAction,
  mergePostAction,
  pinPostAction,
  publishPostAction,
  searchMergeTargetsAction,
  updatePostAction,
} from "@/app/actions/posts";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const QuillEditor = dynamic(
  () => import("@/components/comments/quill-editor"),
  { ssr: false }
);

interface PostActionsMenuProps {
  initialBody: string | null;
  initialTitle: string;
  isDraft?: boolean;
  isPinned: boolean;
  postId: string;
  postTitle: string;
  workspaceId: string;
}

interface MergeTarget {
  id: string;
  title: string;
  upvotes: number;
}

// Feedback-level actions (edit / duplicate / pin / merge / delete of the whole
// item), kept in a dedicated menu and clearly labelled "Feedback" so they can't
// be mistaken for the per-comment actions inside the comment thread.
export function PostActionsMenu({
  postId,
  workspaceId,
  initialTitle,
  initialBody,
  isDraft = false,
  isPinned,
  postTitle,
}: PostActionsMenuProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody ?? "");
  const [error, setError] = useState<string | null>(null);

  // Merge dialog state
  const [mergeQuery, setMergeQuery] = useState("");
  const [mergeResults, setMergeResults] = useState<MergeTarget[]>([]);
  const [mergeSelected, setMergeSelected] = useState<MergeTarget | null>(null);

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

  function handlePinToggle() {
    startTransition(async () => {
      const result = await pinPostAction({
        postId,
        workspaceId,
        pin: !isPinned,
      });
      if (result.success) {
        toast.success(isPinned ? "Feedback unpinned" : "Feedback pinned");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to update pin.");
      }
    });
  }

  function handlePublish() {
    startTransition(async () => {
      const result = await publishPostAction({ postId, workspaceId });
      if (result.success) {
        toast.success("Draft published");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to publish draft.");
      }
    });
  }

  function handleDuplicate() {
    startTransition(async () => {
      const result = await duplicatePostAction({ postId, workspaceId });
      if (result.success) {
        toast.success("Feedback duplicated");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to duplicate feedback.");
      }
    });
  }

  function openMerge() {
    setMergeQuery("");
    setMergeSelected(null);
    setMergeResults([]);
    setMergeOpen(true);
    runMergeSearch("");
  }

  function runMergeSearch(q: string) {
    setMergeQuery(q);
    setMergeSelected(null);
    startTransition(async () => {
      const result = await searchMergeTargetsAction({
        workspaceId,
        query: q,
        excludePostId: postId,
      });
      if (result.success) {
        setMergeResults(result.data.posts);
      }
    });
  }

  function handleMergeConfirm() {
    if (!mergeSelected) {
      return;
    }
    startTransition(async () => {
      const result = await mergePostAction({
        sourceId: postId,
        targetId: mergeSelected.id,
        workspaceId,
      });
      if (result.success) {
        toast.success("Feedback merged");
        setMergeOpen(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to merge feedback.");
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
        <DropdownMenuContent align="end" className="w-44">
          {isDraft && (
            <>
              <DropdownMenuItem onSelect={handlePublish}>
                <Send />
                Publish
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onSelect={openEdit}>
            <Pencil />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleDuplicate}>
            <Copy />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handlePinToggle}>
            {isPinned ? <PinOff /> : <Pin />}
            {isPinned ? "Unpin" : "Pin"}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={openMerge}>
            <GitMerge />
            Merge
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={() => setDeleteOpen(true)}
          >
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit */}
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
              <span className="block text-xs font-medium text-foreground">
                Description
              </span>
              <QuillEditor
                disabled={isPending}
                onChange={(html) => setBody(html)}
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

      {/* Merge */}
      <Dialog onOpenChange={setMergeOpen} open={mergeOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Merge feedback</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Merge <span className="font-medium">"{postTitle}"</span> into
              another post. Its votes transfer to the target and this post is
              locked.
            </p>
            <input
              className="w-full border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              onChange={(e) => runMergeSearch(e.target.value)}
              placeholder="Search posts to merge into…"
              type="text"
              value={mergeQuery}
            />
            <div className="max-h-60 divide-y divide-border overflow-y-auto border border-border">
              {mergeResults.length === 0 ? (
                <p className="px-3 py-3 text-xs text-muted-foreground">
                  No matching posts.
                </p>
              ) : (
                mergeResults.map((r) => (
                  <button
                    className={`block w-full px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none ${
                      mergeSelected?.id === r.id
                        ? "bg-primary/10 text-foreground"
                        : "text-foreground hover:bg-muted/60"
                    }`}
                    key={r.id}
                    onClick={() => setMergeSelected(r)}
                    type="button"
                  >
                    <span className="line-clamp-1">{r.title}</span>
                    <span className="text-2xs text-muted-foreground">
                      ↑ {r.upvotes}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
          <DialogFooter>
            <button
              className="px-3 py-1.5 text-xs text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              disabled={isPending}
              onClick={() => setMergeOpen(false)}
              type="button"
            >
              Cancel
            </button>
            <button
              className="bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground transition-colors duration-150 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              disabled={isPending || !mergeSelected}
              onClick={handleMergeConfirm}
              type="button"
            >
              {isPending ? "Merging…" : "Merge"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
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
