"use client";

import { ImagePlus, Plus, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { createPostAction, uploadPostImageAction } from "@/app/actions/posts";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

interface Category {
  color: string;
  id: string;
  name: string;
}

interface WorkspaceStatus {
  isDefault: boolean;
  name: string;
  slug: string;
}

interface AddFeedbackDialogProps {
  boardId: string;
  categories: Category[];
  defaultOpen?: boolean;
  workspaceId: string;
  workspaceSlug: string;
  workspaceStatuses: WorkspaceStatus[];
}

export function AddFeedbackDialog({
  boardId,
  categories,
  defaultOpen = false,
  workspaceId,
  workspaceSlug,
  workspaceStatuses,
}: AddFeedbackDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const defaultStatus =
    workspaceStatuses.find((s) => s.isDefault)?.slug ??
    workspaceStatuses[0]?.slug ??
    "";
  const [status, setStatus] = useState(defaultStatus);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setTitle("");
    setBody("");
    setCategoryId("");
    setStatus(defaultStatus);
    setTitleError(null);
    removeImage();
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setImageError(null);
    if (!file) {
      return;
    }
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      setImageError("Use a PNG, JPEG, WEBP, or GIF image.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError("Image must be 4MB or smaller.");
      return;
    }
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  }

  function removeImage() {
    setImageFile(null);
    setImagePreviewUrl(null);
    setImageError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTitleError(null);

    if (title.trim().length < 3) {
      setTitleError("Title must be at least 3 characters.");
      return;
    }

    startTransition(async () => {
      let imageUrl: string | undefined;

      if (imageFile) {
        const imageFormData = new FormData();
        imageFormData.set("image", imageFile);
        const uploadResult = await uploadPostImageAction(imageFormData);
        if (!uploadResult.success) {
          setImageError(uploadResult.error);
          return;
        }
        imageUrl = uploadResult.data.url;
      }

      const result = await createPostAction({
        boardId,
        workspaceId,
        title: title.trim(),
        body: body.trim() || undefined,
        categoryId: categoryId || undefined,
        imageUrl,
        status: status || undefined,
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
        <Button type="button">
          <Plus data-icon="inline-start" />
          Add Feedback
        </Button>
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

          {workspaceStatuses.length > 0 && (
            <div>
              <label
                className="mb-1.5 block text-sm font-medium text-foreground"
                htmlFor="feedback-status"
              >
                Status
              </label>
              <select
                className="w-full border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                disabled={isPending}
                id="feedback-status"
                onChange={(e) => setStatus(e.target.value)}
                value={status}
              >
                {workspaceStatuses.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

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
            {categories.length > 0 ? (
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
            ) : (
              <p
                className="border border-dashed border-input px-3 py-2 text-sm text-muted-foreground"
                id="feedback-category"
              >
                No categories yet —{" "}
                <Link
                  className="font-medium text-primary hover:underline"
                  href={`/${workspaceSlug}/settings/categories`}
                  target="_blank"
                >
                  create one
                </Link>{" "}
                to start organizing feedback.
              </p>
            )}
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-foreground">
              Image{" "}
              <span className="text-xs font-normal text-muted-foreground">
                (optional)
              </span>
            </span>
            {imagePreviewUrl ? (
              <div className="relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {/* biome-ignore lint/performance/noImgElement: dynamic S3/R2/local upload URL, not known at build time for next/image */}
                <img
                  alt=""
                  className="max-h-40 w-auto border border-input object-contain"
                  src={imagePreviewUrl}
                />
                <button
                  aria-label="Remove image"
                  className="absolute -top-2 -right-2 flex size-6 items-center justify-center border border-border bg-background text-destructive hover:opacity-70 transition-opacity duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  disabled={isPending}
                  onClick={removeImage}
                  type="button"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ) : (
              <label
                className={`flex w-full cursor-pointer items-center justify-center gap-1.5 border border-dashed border-input px-3 py-3 text-sm text-muted-foreground transition-colors duration-150 hover:border-muted-foreground/50 hover:text-foreground ${
                  isPending ? "pointer-events-none opacity-50" : ""
                }`}
              >
                <ImagePlus className="size-4" />
                Add an image
                <input
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="sr-only"
                  disabled={isPending}
                  onChange={handleImageChange}
                  ref={fileInputRef}
                  type="file"
                />
              </label>
            )}
            {imageError && (
              <p className="mt-1 text-xs text-destructive">{imageError}</p>
            )}
          </div>

          <div className="flex justify-end">
            <button
              className="bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors duration-150 hover:bg-primary/90 disabled:opacity-50"
              disabled={isPending || title.trim().length < 3}
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
