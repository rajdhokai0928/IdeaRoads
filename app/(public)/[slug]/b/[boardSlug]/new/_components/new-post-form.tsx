"use client";

import { ArrowLeft, ImagePlus, X } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { createPostAction, uploadPostImageAction } from "@/app/actions/posts";
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

interface Props {
  boardId: string;
  boardName: string;
  boardSlug: string;
  categories: Category[];
  embedQuery?: string;
  isEmbed?: boolean;
  workspaceId: string;
  workspaceSlug: string;
}

export default function NewPostForm({
  boardId,
  workspaceId,
  workspaceSlug,
  boardSlug,
  boardName,
  categories,
  isEmbed = false,
  embedQuery = "",
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [titleError, setTitleError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const boardHref = `/${workspaceSlug}/b/${boardSlug}${embedQuery}`;

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
    setGeneralError(null);

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
      });

      if (!result.success) {
        if (result.field === "title") {
          setTitleError(result.error);
        } else {
          setGeneralError(result.error);
        }
        return;
      }

      router.push(
        `/${workspaceSlug}/b/${boardSlug}/p/${result.data.postSlug}${embedQuery}`
      );
    });
  }

  return (
    <div className="flex flex-col">
      {/* Back nav — hidden in embed mode (no navigation chrome) */}
      {!isEmbed && (
        <div className="border-b border-border px-8 py-4">
          <Link
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            href={boardHref}
          >
            <ArrowLeft className="size-4" />
            {boardName}
          </Link>
        </div>
      )}

      <div className="px-8 py-8 max-w-2xl">
        <h1 className="text-xl font-semibold text-foreground mb-6">
          Submit feedback
        </h1>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Title */}
          <div>
            <label
              className="block text-sm font-medium text-foreground mb-1.5"
              htmlFor="post-title"
            >
              Title <span className="text-destructive">*</span>
            </label>
            <input
              className={`w-full px-3 py-2.5 text-sm bg-background border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 ${
                titleError ? "border-destructive" : "border-input"
              }`}
              disabled={isPending}
              id="post-title"
              maxLength={150}
              onChange={(e) => {
                setTitle(e.target.value);
                if (titleError) {
                  setTitleError(null);
                }
              }}
              placeholder="Short, descriptive title for your idea or request"
              required
              type="text"
              value={title}
            />
            <div className="flex items-start justify-between mt-1">
              {titleError ? (
                <p className="text-xs text-destructive">{titleError}</p>
              ) : (
                <span />
              )}
              <span className="text-xs text-muted-foreground shrink-0 ml-2">
                {title.length}/150
              </span>
            </div>
          </div>

          {/* Body */}
          <div>
            <span className="block text-sm font-medium text-foreground mb-1.5">
              Description{" "}
              <span className="text-muted-foreground font-normal text-xs">
                (optional)
              </span>
            </span>
            <QuillEditor
              disabled={isPending}
              minHeight={120}
              onChange={(html) => setBody(html)}
              placeholder="Add more context — what problem does this solve? What would the ideal solution look like?"
              value={body}
            />
          </div>

          {/* Category (optional) */}
          {categories.length > 0 && (
            <div>
              <label
                className="block text-sm font-medium text-foreground mb-1.5"
                htmlFor="post-category"
              >
                Category{" "}
                <span className="text-muted-foreground font-normal text-xs">
                  (optional)
                </span>
              </label>
              <Select
                disabled={isPending}
                onValueChange={(v) => setCategoryId(v === "none" ? "" : v)}
                value={categoryId || "none"}
              >
                <SelectTrigger className="w-full" id="post-category">
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
            </div>
          )}

          {/* Image (optional) */}
          <div>
            <span className="block text-sm font-medium text-foreground mb-1.5">
              Image{" "}
              <span className="text-muted-foreground font-normal text-xs">
                (optional)
              </span>
            </span>
            {imagePreviewUrl ? (
              <div className="relative inline-block">
                {/* biome-ignore lint/performance/noImgElement: local blob: preview URL, next/image can't optimize it anyway */}
                <img
                  alt=""
                  className="max-h-48 w-auto border border-input object-contain"
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
                className={`flex w-full cursor-pointer items-center justify-center gap-1.5 border border-dashed border-input px-3 py-4 text-sm text-muted-foreground transition-colors duration-150 hover:border-muted-foreground/50 hover:text-foreground ${
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

          {generalError && (
            <p className="text-sm text-destructive">{generalError}</p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <button
              className="px-5 py-2.5 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              disabled={isPending || title.trim().length < 3}
              type="submit"
            >
              {isPending ? "Submitting…" : "Submit feedback"}
            </button>
            <Link
              className="px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              href={boardHref}
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
