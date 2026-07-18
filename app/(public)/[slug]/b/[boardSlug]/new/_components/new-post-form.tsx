"use client";

import { ArrowLeftIcon, ImageIcon, XIcon } from "@phosphor-icons/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { createPostAction, uploadPostImageAction } from "@/app/actions/posts";
import { Button } from "@/components/ui/button";
import { ImagePreviewThumbnail } from "@/components/ui/image-preview-thumbnail";
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
  isDefault: boolean;
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
  const defaultCategoryId =
    categories.find((c) => c.isDefault)?.id ?? categories[0]?.id ?? "";
  const [categoryId, setCategoryId] = useState(defaultCategoryId);
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
        <div className="border-b border-ir-border px-8 py-4">
          <Link
            className="inline-flex items-center gap-1.5 text-sm text-ir-muted transition-colors duration-150 ease-ir-standard hover:text-ir-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40"
            href={boardHref}
          >
            <ArrowLeftIcon className="size-4" />
            {boardName}
          </Link>
        </div>
      )}

      <div className="px-8 py-8">
        <h1 className="mb-6 text-xl font-semibold text-ir-heading">
          Submit feedback
        </h1>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Title */}
          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-ir-heading"
              htmlFor="post-title"
            >
              Title <span className="text-ir-danger">*</span>
            </label>
            <input
              autoComplete="off"
              className={`w-full rounded-ir-input border bg-ir-surface px-3 py-2.5 text-sm text-ir-body placeholder:text-ir-muted focus:outline-none focus:ring-2 focus:ring-ir-primary/40 disabled:opacity-50 ${
                titleError ? "border-ir-danger" : "border-ir-border"
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
            <div className="mt-1 flex items-start justify-between">
              {titleError ? (
                <p className="text-xs text-ir-danger">{titleError}</p>
              ) : (
                <span />
              )}
              <span className="ml-2 shrink-0 text-xs text-ir-muted">
                {title.length}/150
              </span>
            </div>
          </div>

          {/* Body */}
          <div>
            <span className="mb-1.5 block text-sm font-medium text-ir-heading">
              Description{" "}
              <span className="text-xs font-normal text-ir-muted">
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

          {/* Category */}
          {categories.length > 0 && (
            <div>
              <label
                className="mb-1.5 block text-sm font-medium text-ir-heading"
                htmlFor="post-category"
              >
                Category <span className="text-ir-danger">*</span>
              </label>
              <Select
                disabled={isPending}
                onValueChange={setCategoryId}
                value={categoryId}
              >
                <SelectTrigger className="w-full" id="post-category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
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
            <span className="mb-1.5 block text-sm font-medium text-ir-heading">
              Image{" "}
              <span className="text-xs font-normal text-ir-muted">
                (optional)
              </span>
            </span>
            {imagePreviewUrl ? (
              <div className="relative inline-block">
                <ImagePreviewThumbnail
                  className="max-h-48 w-auto rounded-ir-sm border border-ir-border object-contain"
                  src={imagePreviewUrl}
                />
                <button
                  aria-label="Remove image"
                  className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-ir-full border border-ir-border bg-ir-surface text-ir-danger shadow-ir-sm transition-opacity duration-150 ease-ir-standard hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40"
                  disabled={isPending}
                  onClick={removeImage}
                  type="button"
                >
                  <XIcon className="size-3.5" />
                </button>
              </div>
            ) : (
              <label
                className={`flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-ir-input border border-dashed border-ir-border px-3 py-4 text-sm text-ir-muted transition-colors duration-150 ease-ir-standard hover:border-ir-primary/40 hover:text-ir-heading ${
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

          {generalError && (
            <p className="text-sm text-ir-danger">{generalError}</p>
          )}

          {/* Actions — pinned to the bottom-right of the form */}
          <div className="flex items-center justify-end gap-3 border-t border-ir-border pt-5">
            <Link
              className="rounded-ir-sm px-3 py-2.5 text-sm text-ir-muted transition-colors duration-150 ease-ir-standard hover:text-ir-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40"
              href={boardHref}
            >
              Cancel
            </Link>
            <Button
              disabled={isPending || title.trim().length < 3}
              type="submit"
            >
              {isPending ? "Submitting…" : "Submit feedback"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
