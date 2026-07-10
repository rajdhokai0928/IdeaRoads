"use client";

import { ImageIcon, PlusIcon, XIcon } from "@phosphor-icons/react";
import dynamic from "next/dynamic";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const QuillEditor = dynamic(
  () => import("@/components/comments/quill-editor"),
  { ssr: false }
);

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
  const [pendingAction, setPendingAction] = useState<
    null | "publish" | "draft"
  >(null);

  function reset() {
    setTitle("");
    setBody("");
    setCategoryId("");
    setStatus(defaultStatus);
    setTitleError(null);
    setPendingAction(null);
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

  function submit(asDraft: boolean) {
    setTitleError(null);

    if (title.trim().length < 3) {
      setTitleError("Title must be at least 3 characters.");
      return;
    }

    setPendingAction(asDraft ? "draft" : "publish");
    startTransition(async () => {
      let imageUrl: string | undefined;

      if (imageFile) {
        const imageFormData = new FormData();
        imageFormData.set("image", imageFile);
        const uploadResult = await uploadPostImageAction(imageFormData);
        if (!uploadResult.success) {
          setImageError(uploadResult.error);
          setPendingAction(null);
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
        saveAsDraft: asDraft,
      });

      setPendingAction(null);

      if (!result.success) {
        if (result.field === "title") {
          setTitleError(result.error);
        } else {
          toast.error(result.error);
        }
        return;
      }

      toast.success(result.data.isDraft ? "Draft saved" : "Feedback published");
      setOpen(false);
      reset();
      // Drafts: stay on the feedback list (refresh in place) so the new draft
      // appears with its badge and the user can immediately create another.
      // Published feedback: jump to the post so they can see it live.
      if (result.data.isDraft) {
        router.refresh();
      } else {
        router.push(`/${workspaceSlug}/feedback/${result.data.postId}`);
      }
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submit(false);
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button type="button">
          <PlusIcon data-icon="inline-start" />
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
              className="mb-1.5 block text-sm font-medium text-ir-heading"
              htmlFor="feedback-title"
            >
              Title <span className="text-ir-danger">*</span>
            </label>
            <input
              className={`w-full rounded-ir-input border bg-ir-surface px-3 py-2 text-sm text-ir-body placeholder:text-ir-muted focus:outline-none focus:ring-2 focus:ring-ir-primary/40 disabled:opacity-50 ${
                titleError ? "border-ir-danger" : "border-ir-border"
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
              <p className="mt-1 text-xs text-ir-danger">{titleError}</p>
            )}
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-ir-heading">
              Description{" "}
              <span className="text-xs font-normal text-ir-muted">
                (optional)
              </span>
            </span>
            <QuillEditor
              disabled={isPending}
              onChange={(html) => setBody(html)}
              placeholder="Add more context…"
              value={body}
            />
          </div>

          {workspaceStatuses.length > 0 && (
            <div>
              <label
                className="mb-1.5 block text-sm font-medium text-ir-heading"
                htmlFor="feedback-status"
              >
                Status
              </label>
              <Select
                disabled={isPending}
                onValueChange={(v) => setStatus(v)}
                value={status}
              >
                <SelectTrigger className="w-full" id="feedback-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {workspaceStatuses.map((s) => (
                    <SelectItem key={s.slug} value={s.slug}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-ir-heading"
              htmlFor="feedback-category"
            >
              Category{" "}
              <span className="text-xs font-normal text-ir-muted">
                (optional)
              </span>
            </label>
            {categories.length > 0 ? (
              <Select
                disabled={isPending}
                onValueChange={(v) => setCategoryId(v === "none" ? "" : v)}
                value={categoryId || "none"}
              >
                <SelectTrigger className="w-full" id="feedback-category">
                  <SelectValue placeholder="No category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p
                className="rounded-ir-input border border-dashed border-ir-border px-3 py-2 text-sm text-ir-muted"
                id="feedback-category"
              >
                No categories yet —{" "}
                <Link
                  className="font-medium text-ir-primary hover:underline"
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
            <span className="mb-1.5 block text-sm font-medium text-ir-heading">
              Image{" "}
              <span className="text-xs font-normal text-ir-muted">
                (optional)
              </span>
            </span>
            {imagePreviewUrl ? (
              <div className="relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {/* biome-ignore lint/performance/noImgElement: dynamic S3/R2/local upload URL, not known at build time for next/image */}
                <img
                  alt=""
                  className="max-h-40 w-auto rounded-ir-md border border-ir-border object-contain"
                  src={imagePreviewUrl}
                />
                <button
                  aria-label="Remove image"
                  className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-ir-full border border-ir-border bg-ir-surface text-ir-danger shadow-ir-xs transition-opacity duration-150 hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40"
                  disabled={isPending}
                  onClick={removeImage}
                  type="button"
                >
                  <XIcon className="size-3.5" />
                </button>
              </div>
            ) : (
              <label
                className={`flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-ir-input border border-dashed border-ir-border px-3 py-3 text-sm text-ir-muted transition-colors duration-150 ease-ir-standard hover:border-ir-primary/40 hover:text-ir-heading ${
                  isPending ? "pointer-events-none opacity-50" : ""
                }`}
              >
                <ImageIcon className="size-4" />
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
              <p className="mt-1 text-xs text-ir-danger">{imageError}</p>
            )}
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              disabled={isPending || title.trim().length < 3}
              onClick={() => submit(true)}
              type="button"
              variant="outline"
            >
              {pendingAction === "draft" ? "Saving…" : "Save as Draft"}
            </Button>
            <Button
              disabled={isPending || title.trim().length < 3}
              type="submit"
            >
              {pendingAction === "publish" ? "Publishing…" : "Publish"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
