"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createPostAction } from "@/app/actions/posts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Board {
  id: string;
  name: string;
}

interface Category {
  color: string;
  id: string;
  name: string;
}

interface AddFeedbackDialogProps {
  boards: Board[];
  categories: Category[];
  defaultBoardId?: string;
  defaultOpen?: boolean;
  workspaceId: string;
  workspaceSlug: string;
}

export function AddFeedbackDialog({
  boards,
  categories,
  defaultBoardId,
  defaultOpen = false,
  workspaceId,
  workspaceSlug,
}: AddFeedbackDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const [boardId, setBoardId] = useState(defaultBoardId ?? boards[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [titleError, setTitleError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setTitle("");
    setBody("");
    setCategoryId("");
    setTitleError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTitleError(null);

    if (title.trim().length < 3) {
      setTitleError("Title must be at least 3 characters.");
      return;
    }
    if (!boardId) {
      toast.error("Select a board.");
      return;
    }

    startTransition(async () => {
      const result = await createPostAction({
        boardId,
        workspaceId,
        title: title.trim(),
        body: body.trim() || undefined,
        categoryId: categoryId || undefined,
      });

      if (!result.success) {
        if (result.field === "title") {
          setTitleError(result.error);
        } else {
          toast.error(result.error);
        }
        return;
      }

      toast.success("Feedback created");
      setOpen(false);
      reset();
      router.push(`/${workspaceSlug}/feedback/${result.data.postId}`);
    });
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <button
          className="flex items-center gap-1.5 bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors duration-150 hover:bg-primary/90"
          type="button"
        >
          <Plus className="size-4" />
          Add Feedback
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add feedback</DialogTitle>
          <DialogDescription>
            Create a new piece of feedback on behalf of your team or a customer.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-foreground"
              htmlFor="feedback-board"
            >
              Board
            </label>
            <select
              className="w-full border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              disabled={isPending}
              id="feedback-board"
              onChange={(e) => setBoardId(e.target.value)}
              value={boardId}
            >
              {boards.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-foreground"
              htmlFor="feedback-title"
            >
              Title <span className="text-destructive">*</span>
            </label>
            <input
              className={`w-full border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 ${
                titleError ? "border-destructive" : "border-input"
              }`}
              disabled={isPending}
              id="feedback-title"
              maxLength={150}
              onChange={(e) => {
                setTitle(e.target.value);
                if (titleError) {
                  setTitleError(null);
                }
              }}
              placeholder="Short, descriptive title"
              type="text"
              value={title}
            />
            {titleError && (
              <p className="mt-1 text-xs text-destructive">{titleError}</p>
            )}
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-foreground"
              htmlFor="feedback-body"
            >
              Description{" "}
              <span className="text-xs font-normal text-muted-foreground">
                (optional)
              </span>
            </label>
            <textarea
              className="w-full resize-none border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              disabled={isPending}
              id="feedback-body"
              maxLength={10_000}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Add more context…"
              rows={4}
              value={body}
            />
          </div>

          {categories.length > 0 && (
            <div>
              <label
                className="mb-1.5 block text-sm font-medium text-foreground"
                htmlFor="feedback-category"
              >
                Category{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  (optional)
                </span>
              </label>
              <select
                className="w-full border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                disabled={isPending}
                id="feedback-category"
                onChange={(e) => setCategoryId(e.target.value)}
                value={categoryId}
              >
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end">
            <button
              className="bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors duration-150 hover:bg-primary/90 disabled:opacity-50"
              disabled={isPending || title.trim().length < 3 || !boardId}
              type="submit"
            >
              {isPending ? "Creating…" : "Create feedback"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
