"use client";

import { ImagePlus, Pencil, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useContext,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";
import { updatePostAction, uploadPostImageAction } from "@/app/actions/posts";
import { FeedbackBody } from "@/components/posts/feedback-body";

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

// Inline editing for the feedback detail page: Title, Description and the Image
// are edited in place (no modal) and saved together through the single existing
// updatePostAction. Status / Category / Assignee stay on their own instant-save
// dropdowns in the header (see StatusSelect / CategorySelect / AssigneeSelect),
// so every field is editable — those three the moment you pick a value, and
// title/description/image when you press Save.

interface PostEditContextValue {
  cancel: () => void;
  canEdit: boolean;
  currentImage: string | null;
  draftBody: string;
  draftTitle: string;
  editing: boolean;
  error: string | null;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  imageError: string | null;
  isPending: boolean;
  removeImage: () => void;
  save: () => void;
  setDraftBody: (value: string) => void;
  setDraftTitle: (value: string) => void;
  startEdit: () => void;
}

const PostEditContext = createContext<PostEditContextValue | null>(null);

function usePostEdit(): PostEditContextValue {
  const ctx = useContext(PostEditContext);
  if (!ctx) {
    throw new Error("usePostEdit must be used within a PostEditProvider");
  }
  return ctx;
}

interface PostEditProviderProps {
  canEdit: boolean;
  children: ReactNode;
  defaultEditing?: boolean;
  initialBody: string | null;
  initialImageUrl: string | null;
  initialTitle: string;
  postId: string;
  workspaceId: string;
}

export function PostEditProvider({
  postId,
  workspaceId,
  initialTitle,
  initialBody,
  initialImageUrl,
  canEdit,
  defaultEditing = false,
  children,
}: PostEditProviderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(defaultEditing && canEdit);
  const [draftTitle, setDraftTitle] = useState(initialTitle);
  const [draftBody, setDraftBody] = useState(initialBody ?? "");
  const [error, setError] = useState<string | null>(null);

  // Image staging: a newly picked file, whether the existing image was removed,
  // and its own validation error.
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // What to show in the image slot right now: the new preview, else the existing
  // image (unless the user removed it).
  const currentImage =
    imagePreviewUrl ?? (imageRemoved ? null : initialImageUrl);

  function resetImage() {
    setImageFile(null);
    setImagePreviewUrl(null);
    setImageRemoved(false);
    setImageError(null);
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
    setImageRemoved(false);
  }

  function removeImage() {
    setImageFile(null);
    setImagePreviewUrl(null);
    setImageError(null);
    // If there was a saved image, mark it for removal on save.
    setImageRemoved(true);
  }

  function startEdit() {
    setDraftTitle(initialTitle);
    setDraftBody(initialBody ?? "");
    setError(null);
    resetImage();
    setEditing(true);
  }

  function cancel() {
    setError(null);
    resetImage();
    setEditing(false);
  }

  function save() {
    // Same validation the old dialog used.
    if (draftTitle.trim().length < 3) {
      setError("Title must be at least 3 characters.");
      return;
    }
    setError(null);
    startTransition(async () => {
      // Resolve the image: upload a new file, clear it, or leave it untouched.
      let imageUrl: string | null | undefined;
      if (imageFile) {
        const form = new FormData();
        form.set("image", imageFile);
        const upload = await uploadPostImageAction(form);
        if (!upload.success) {
          setImageError(upload.error);
          return;
        }
        imageUrl = upload.data.url;
      } else if (imageRemoved) {
        imageUrl = null;
      } else {
        imageUrl = undefined;
      }

      const result = await updatePostAction({
        postId,
        workspaceId,
        title: draftTitle.trim(),
        body: draftBody.trim() || undefined,
        imageUrl,
      });
      if (result.success) {
        toast.success("Feedback updated");
        resetImage();
        setEditing(false);
        router.refresh();
      } else {
        setError(result.error ?? "Failed to update feedback.");
      }
    });
  }

  return (
    <PostEditContext.Provider
      value={{
        canEdit,
        editing,
        draftTitle,
        draftBody,
        error,
        isPending,
        currentImage,
        imageError,
        setDraftTitle,
        setDraftBody,
        handleImageChange,
        removeImage,
        startEdit,
        cancel,
        save,
      }}
    >
      {children}
    </PostEditContext.Provider>
  );
}

// Renders the title as a heading, or a text input when editing.
export function EditableTitle({
  title,
  className,
}: {
  className?: string;
  title: string;
}) {
  const { editing, draftTitle, setDraftTitle, isPending } = usePostEdit();

  if (!editing) {
    return <h1 className={className}>{title}</h1>;
  }

  return (
    <input
      aria-label="Feedback title"
      className="w-full border border-input bg-background px-3 py-2 text-lg font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
      disabled={isPending}
      maxLength={150}
      onChange={(e) => setDraftTitle(e.target.value)}
      value={draftTitle}
    />
  );
}

// View: the description + image. Edit: the rich-text editor, an image
// upload/remove control, and the Save/Cancel bar (the footer of the edit form).
export function EditablePostContent({
  body,
  imageUrl,
  className,
}: {
  body: string | null;
  className?: string;
  imageUrl: string | null;
}) {
  const {
    editing,
    draftBody,
    setDraftBody,
    isPending,
    error,
    draftTitle,
    currentImage,
    imageError,
    handleImageChange,
    removeImage,
    save,
    cancel,
  } = usePostEdit();

  if (!editing) {
    return (
      <>
        {body && (
          <div className="mt-6 border-t border-border pt-6">
            <FeedbackBody body={body} className={className} />
          </div>
        )}
        {imageUrl && (
          <div className={body ? "mt-4" : "mt-6 border-t border-border pt-6"}>
            {/* biome-ignore lint/performance/noImgElement: dynamic S3/R2/local upload URL, not known at build time for next/image */}
            <img
              alt=""
              className="max-h-96 w-auto border border-border object-contain"
              src={imageUrl}
            />
          </div>
        )}
      </>
    );
  }

  return (
    <div className="mt-6 space-y-4 border-t border-border pt-6">
      {/* Description */}
      <div className="space-y-1.5">
        <span className="block text-xs font-medium text-foreground">
          Description
        </span>
        <QuillEditor
          disabled={isPending}
          onChange={(html) => setDraftBody(html)}
          placeholder="Add more detail (optional)"
          value={draftBody}
        />
      </div>

      {/* Image */}
      <div className="space-y-1.5">
        <span className="block text-xs font-medium text-foreground">
          Image{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </span>
        {currentImage ? (
          <div className="relative inline-block">
            {/* biome-ignore lint/performance/noImgElement: dynamic upload / blob preview URL */}
            <img
              alt=""
              className="max-h-48 w-auto border border-input object-contain"
              src={currentImage}
            />
            <button
              aria-label="Remove image"
              className="absolute -top-2 -right-2 flex size-6 items-center justify-center border border-border bg-background text-destructive transition-opacity duration-150 hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
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
              type="file"
            />
          </label>
        )}
        {imageError && <p className="text-xs text-destructive">{imageError}</p>}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex items-center justify-end gap-2">
        <button
          className="px-3 py-1.5 text-xs text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          disabled={isPending}
          onClick={cancel}
          type="button"
        >
          Cancel
        </button>
        <button
          className="bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground transition-colors duration-150 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          disabled={isPending || draftTitle.trim().length < 3}
          onClick={save}
          type="button"
        >
          {isPending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}

// The "Edit" affordance shown in the detail actions row (view mode only).
export function EditPostControls() {
  const { canEdit, editing, startEdit } = usePostEdit();

  if (!canEdit || editing) {
    return null;
  }

  return (
    <button
      className="flex items-center gap-1.5 text-xs text-primary transition-opacity duration-150 hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
      onClick={startEdit}
      type="button"
    >
      <Pencil className="size-3.5" />
      Edit
    </button>
  );
}
