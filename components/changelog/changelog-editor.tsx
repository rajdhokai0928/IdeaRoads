"use client";

import { ImagePlus, Pencil, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";
import {
  createChangelogEntryAction,
  createChangelogLabelAction,
  deleteChangelogLabelAction,
  publishChangelogEntryAction,
  updateChangelogEntryAction,
  updateChangelogLabelAction,
  uploadChangelogCoverImageAction,
} from "@/app/actions/changelog";
import { ChangelogLabelBadge } from "@/components/changelog/changelog-label-badge";
import { LinkedPostsSelector } from "@/components/changelog/linked-posts-selector";
import {
  CHANGELOG_LABEL_VALUES,
  getLabelInfo,
} from "@/lib/changelog/constants";

const QuillEditor = dynamic(
  () => import("@/components/comments/quill-editor"),
  {
    ssr: false,
  }
);

const MAX_COVER_IMAGE_BYTES = 4 * 1024 * 1024;
const ALLOWED_COVER_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

interface LinkedPost {
  boardName: string;
  boardSlug: string;
  id: string;
  slug: string;
  status: string;
  title: string;
  upvotes: number;
}

interface ChangelogLabel {
  color: string;
  id: string;
  name: string;
}

interface ChangelogEditorProps {
  initialEntry?: {
    id: string;
    title: string;
    body: string;
    coverImageUrl: string | null;
    label: string;
    isPublished: boolean;
    linkedPosts: LinkedPost[];
  };
  // Persisted custom labels for this workspace (built-ins excluded). Managed
  // (create/rename/delete) inline from the label section below.
  initialLabels?: ChangelogLabel[];
  workspaceId: string;
  workspaceSlug: string;
}

export function ChangelogEditor({
  workspaceId,
  workspaceSlug,
  initialEntry,
  initialLabels = [],
}: ChangelogEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [entryId, setEntryId] = useState<string | null>(
    initialEntry?.id ?? null
  );
  const [title, setTitle] = useState(initialEntry?.title ?? "");
  const [body, setBody] = useState(initialEntry?.body ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(
    initialEntry?.coverImageUrl ?? null
  );
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [label, setLabel] = useState(initialEntry?.label ?? "new_feature");
  const [newLabel, setNewLabel] = useState("");
  // Persisted custom labels (workspace-scoped). Managed inline below.
  const [labels, setLabels] = useState<ChangelogLabel[]>(initialLabels);
  const [labelBusy, setLabelBusy] = useState(false);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [editingLabelName, setEditingLabelName] = useState("");
  const [linkedPosts, setLinkedPosts] = useState<LinkedPost[]>(
    initialEntry?.linkedPosts ?? []
  );

  // The selected label may be a custom one whose row was deleted; surface it as
  // a read-only chip so the current selection stays visible.
  const orphanLabel = useMemo(() => {
    const isBuiltin = (CHANGELOG_LABEL_VALUES as readonly string[]).includes(
      label
    );
    const isCustom = labels.some((l) => l.name === label);
    return !isBuiltin && !isCustom && label ? label : null;
  }, [label, labels]);

  // Create (or select, if it already exists) a label from the input. Matching is
  // case-insensitive against built-in names/keys and existing custom labels, so
  // duplicates are never created. New custom labels are persisted immediately so
  // they survive a refresh.
  async function addCustomLabel() {
    const raw = newLabel.trim();
    if (!raw || labelBusy) {
      return;
    }
    const lower = raw.toLowerCase();
    const builtinMatch = CHANGELOG_LABEL_VALUES.find(
      (l) =>
        l.toLowerCase() === lower ||
        getLabelInfo(l).label.toLowerCase() === lower
    );
    if (builtinMatch) {
      setLabel(builtinMatch);
      setNewLabel("");
      return;
    }
    const existing = labels.find((l) => l.name.toLowerCase() === lower);
    if (existing) {
      setLabel(existing.name);
      setNewLabel("");
      return;
    }
    setLabelBusy(true);
    const res = await createChangelogLabelAction({ workspaceId, name: raw });
    setLabelBusy(false);
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    setLabels((prev) => [...prev, res.data]);
    setLabel(res.data.name);
    setNewLabel("");
  }

  async function renameLabel(id: string) {
    const original = labels.find((l) => l.id === id);
    const name = editingLabelName.trim();
    if (!original || !name || name === original.name) {
      setEditingLabelId(null);
      return;
    }
    setLabelBusy(true);
    const res = await updateChangelogLabelAction({
      labelId: id,
      workspaceId,
      name,
    });
    setLabelBusy(false);
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    setLabels((prev) => prev.map((l) => (l.id === id ? res.data : l)));
    // Keep the entry's selection pointing at the renamed label.
    if (label === original.name) {
      setLabel(res.data.name);
    }
    setEditingLabelId(null);
  }

  async function removeLabel(id: string, name: string) {
    if (labelBusy) {
      return;
    }
    setLabelBusy(true);
    const res = await deleteChangelogLabelAction({ labelId: id, workspaceId });
    setLabelBusy(false);
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    setLabels((prev) => prev.filter((l) => l.id !== id));
    // If the deleted label was selected, fall back to the default built-in.
    if (label === name) {
      setLabel("new_feature");
    }
    toast.success("Label deleted");
  }
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const isPublished = initialEntry?.isPublished ?? false;

  // Auto-save: debounced, fires after 30s of idle
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingAutoSave = useRef(false);

  const doAutoSave = useCallback(async () => {
    if (!title.trim()) {
      return;
    }
    setSaveStatus("saving");
    try {
      if (entryId) {
        await updateChangelogEntryAction({
          entryId,
          workspaceId,
          title: title.trim(),
          body,
          coverImageUrl,
          label,
          postIds: linkedPosts.map((p) => p.id),
        });
      } else {
        const result = await createChangelogEntryAction({
          workspaceId,
          title: title.trim(),
          body,
          coverImageUrl: coverImageUrl ?? undefined,
          label,
          postIds: linkedPosts.map((p) => p.id),
        });
        if (result.success) {
          setEntryId(result.data.id);
        }
      }
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("idle");
    }
  }, [entryId, workspaceId, title, body, coverImageUrl, label, linkedPosts]);

  // Schedule auto-save whenever content changes
  useEffect(() => {
    if (!title.trim()) {
      return;
    }
    pendingAutoSave.current = true;
    if (autoSaveRef.current) {
      clearTimeout(autoSaveRef.current);
    }
    autoSaveRef.current = setTimeout(() => {
      if (pendingAutoSave.current) {
        pendingAutoSave.current = false;
        doAutoSave();
      }
    }, 30_000);
    return () => {
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
    };
  }, [title, doAutoSave]);

  async function handleCoverImageChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    setCoverError(null);
    if (!file) {
      return;
    }
    if (!ALLOWED_COVER_IMAGE_TYPES.has(file.type)) {
      setCoverError("Use a PNG, JPEG, WEBP, or GIF image.");
      return;
    }
    if (file.size > MAX_COVER_IMAGE_BYTES) {
      setCoverError("Image must be 4MB or smaller.");
      return;
    }

    setIsUploadingCover(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.set("image", file);
      uploadFormData.set("workspaceId", workspaceId);
      const result = await uploadChangelogCoverImageAction(uploadFormData);
      if (!result.success) {
        setCoverError(result.error);
        return;
      }
      setCoverImageUrl(result.data.url);
    } finally {
      setIsUploadingCover(false);
    }
  }

  function removeCoverImage() {
    setCoverImageUrl(null);
    setCoverError(null);
    if (coverInputRef.current) {
      coverInputRef.current.value = "";
    }
  }

  function handleSaveDraft() {
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }
    startTransition(async () => {
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
      if (entryId) {
        const result = await updateChangelogEntryAction({
          entryId,
          workspaceId,
          title: title.trim(),
          body,
          coverImageUrl,
          label,
          postIds: linkedPosts.map((p) => p.id),
        });
        if (!result.success) {
          toast.error(result.error);
          return;
        }
        toast.success("Draft saved");
        router.push(`/${workspaceSlug}/settings/changelog`);
      } else {
        const result = await createChangelogEntryAction({
          workspaceId,
          title: title.trim(),
          body,
          coverImageUrl: coverImageUrl ?? undefined,
          label,
          postIds: linkedPosts.map((p) => p.id),
        });
        if (!result.success) {
          toast.error(result.error);
          return;
        }
        toast.success("Draft saved");
        router.push(`/${workspaceSlug}/settings/changelog`);
      }
    });
  }

  function handlePublish() {
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }
    startTransition(async () => {
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }

      let id = entryId;
      if (id) {
        const result = await updateChangelogEntryAction({
          entryId: id,
          workspaceId,
          title: title.trim(),
          body,
          coverImageUrl,
          label,
          postIds: linkedPosts.map((p) => p.id),
        });
        if (!result.success) {
          toast.error(result.error);
          return;
        }
      } else {
        const result = await createChangelogEntryAction({
          workspaceId,
          title: title.trim(),
          body,
          coverImageUrl: coverImageUrl ?? undefined,
          label,
          postIds: linkedPosts.map((p) => p.id),
        });
        if (!result.success) {
          toast.error(result.error);
          return;
        }
        id = result.data.id;
        setEntryId(id);
      }

      const publishResult = await publishChangelogEntryAction({
        entryId: id,
        workspaceId,
      });
      if (!publishResult.success) {
        toast.error(publishResult.error);
        return;
      }

      toast.success("Entry published");
      router.push(`/${workspaceSlug}/settings/changelog`);
    });
  }

  function handleUpdate() {
    if (!entryId || !title.trim()) {
      return;
    }
    startTransition(async () => {
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
      const result = await updateChangelogEntryAction({
        entryId,
        workspaceId,
        title: title.trim(),
        body,
        coverImageUrl,
        label,
        postIds: linkedPosts.map((p) => p.id),
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Entry updated");
      router.push(`/${workspaceSlug}/settings/changelog`);
    });
  }

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:px-8">
      {/* Cover image — first, so it can be chosen before the details */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground uppercase tracking-wide">
          Cover image
          <span className="ml-1 text-muted-foreground font-normal normal-case">
            (optional)
          </span>
        </label>
        {coverImageUrl ? (
          <div className="relative block w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {/* biome-ignore lint/performance/noImgElement: dynamic S3/R2/local upload URL, not known at build time for next/image */}
            <img
              alt=""
              className="max-h-64 w-full border border-border bg-muted/30 object-contain"
              src={coverImageUrl}
            />
            <button
              aria-label="Remove cover image"
              className="absolute -top-2 -right-2 flex size-6 items-center justify-center border border-border bg-background text-destructive hover:opacity-70 transition-opacity duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={removeCoverImage}
              type="button"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ) : (
          <label
            className={`flex w-full cursor-pointer items-center justify-center gap-1.5 border border-dashed border-input px-3 py-8 text-sm text-muted-foreground transition-colors duration-150 hover:border-muted-foreground/50 hover:text-foreground ${
              isUploadingCover ? "pointer-events-none opacity-50" : ""
            }`}
          >
            <ImagePlus className="size-4" />
            {isUploadingCover ? "Uploading…" : "Add a cover image"}
            <input
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="sr-only"
              disabled={isUploadingCover}
              onChange={handleCoverImageChange}
              ref={coverInputRef}
              type="file"
            />
          </label>
        )}
        {coverError && <p className="text-xs text-destructive">{coverError}</p>}
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <label
          className="text-xs font-semibold text-foreground uppercase tracking-wide"
          htmlFor="title"
        >
          Title
        </label>
        <div className="relative">
          <input
            className="w-full border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            id="title"
            maxLength={200}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What shipped?"
            type="text"
            value={title}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {title.length}/200
          </span>
        </div>
      </div>

      {/* Content — immediately after the title */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground uppercase tracking-wide">
          Content
        </label>
        <QuillEditor
          minHeight={240}
          onChange={(html) => setBody(html)}
          placeholder="What shipped in this update?"
          value={body}
        />
      </div>

      {/* Label — built-in labels plus a create-your-own field */}
      <div className="space-y-1.5">
        <label
          className="text-xs font-semibold text-foreground uppercase tracking-wide"
          htmlFor="new-label"
        >
          Label
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {/* Built-in labels — always available, not editable. */}
          {CHANGELOG_LABEL_VALUES.map((l) => {
            const info = getLabelInfo(l);
            const isActive = label === l;
            return (
              <button
                className={`px-3 py-1.5 text-xs font-semibold border transition-all focus-visible:outline-none focus-visible:ring-2 cursor-pointer focus-visible:ring-ring ${
                  isActive
                    ? "border-current"
                    : "border-border text-muted-foreground hover:border-muted-foreground/50"
                }`}
                key={l}
                onClick={() => setLabel(l)}
                style={
                  isActive
                    ? {
                        color: info.color,
                        backgroundColor: `${info.color}12`,
                        borderColor: `${info.color}60`,
                      }
                    : {}
                }
                type="button"
              >
                {info.label}
              </button>
            );
          })}

          {/* Custom labels — selectable, with inline rename + delete. */}
          {labels.map((l) => {
            const isActive = label === l.name;
            if (editingLabelId === l.id) {
              return (
                <input
                  aria-label={`Rename ${l.name}`}
                  autoFocus
                  className="border border-ring bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  key={l.id}
                  maxLength={40}
                  onBlur={() => renameLabel(l.id)}
                  onChange={(e) => setEditingLabelName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      renameLabel(l.id);
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      setEditingLabelId(null);
                    }
                  }}
                  value={editingLabelName}
                />
              );
            }
            return (
              <span
                className={`inline-flex items-center gap-1 border pl-3 pr-1.5 py-1.5 text-xs font-semibold transition-all ${
                  isActive
                    ? "border-current"
                    : "border-border text-muted-foreground hover:border-muted-foreground/50"
                }`}
                key={l.id}
                style={
                  isActive
                    ? {
                        color: l.color,
                        backgroundColor: `${l.color}12`,
                        borderColor: `${l.color}60`,
                      }
                    : {}
                }
              >
                <button
                  className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => setLabel(l.name)}
                  type="button"
                >
                  {l.name}
                </button>
                <button
                  aria-label={`Rename ${l.name}`}
                  className="text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                  disabled={labelBusy}
                  onClick={() => {
                    setEditingLabelId(l.id);
                    setEditingLabelName(l.name);
                  }}
                  type="button"
                >
                  <Pencil className="size-3" />
                </button>
                <button
                  aria-label={`Delete ${l.name}`}
                  className="text-muted-foreground hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                  disabled={labelBusy}
                  onClick={() => removeLabel(l.id, l.name)}
                  type="button"
                >
                  <X className="size-3" />
                </button>
              </span>
            );
          })}

          {/* The selected label whose row was deleted — read-only. */}
          {orphanLabel && (
            <span
              className="px-3 py-1.5 text-xs font-semibold border border-current"
              style={{
                color: getLabelInfo(orphanLabel).color,
                backgroundColor: `${getLabelInfo(orphanLabel).color}12`,
                borderColor: `${getLabelInfo(orphanLabel).color}60`,
              }}
            >
              {orphanLabel}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            className="w-full max-w-xs border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            id="new-label"
            maxLength={40}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomLabel();
              }
            }}
            placeholder="Create a new label…"
            type="text"
            value={newLabel}
          />
          <button
            className="shrink-0 border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            disabled={!newLabel.trim() || labelBusy}
            onClick={addCustomLabel}
            type="button"
          >
            {labelBusy ? "Saving…" : "Add"}
          </button>
        </div>
        <div className="mt-1">
          <ChangelogLabelBadge label={label} size="md" />
        </div>
      </div>

      {/* Linked Posts */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground uppercase tracking-wide">
          Linked Feedback Posts
          <span className="ml-1 text-muted-foreground font-normal normal-case">
            (optional)
          </span>
        </label>
        <p className="text-xs text-muted-foreground">
          Link feedback posts that shipped in this update. Voters will be
          notified on first publish.
        </p>
        <LinkedPostsSelector
          onChange={setLinkedPosts}
          selectedPosts={linkedPosts}
          workspaceId={workspaceId}
        />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
        <div className="flex items-center gap-1.5">
          {saveStatus === "saving" && (
            <span className="text-xs text-muted-foreground animate-pulse">
              Saving…
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="text-xs text-success">Saved</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {!isPublished && (
            <button
              className="px-4 py-2 text-sm font-medium border border-border text-foreground hover:bg-muted transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              disabled={isPending || !title.trim()}
              onClick={handleSaveDraft}
              type="button"
            >
              Save Draft
            </button>
          )}

          {isPublished ? (
            <button
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              disabled={isPending || !title.trim()}
              onClick={handleUpdate}
              type="button"
            >
              {isPending ? "Saving…" : "Update"}
            </button>
          ) : (
            <button
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              disabled={isPending || !title.trim()}
              onClick={handlePublish}
              type="button"
            >
              {isPending ? "Publishing…" : "Publish →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
