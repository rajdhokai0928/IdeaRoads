"use client";

import { ImageIcon, PencilIcon, XIcon } from "@phosphor-icons/react";
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
import { Button } from "@/components/ui/button";
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
        <label className="text-xs font-semibold uppercase tracking-wide text-ir-heading">
          Cover image
          <span className="ml-1 font-normal normal-case text-ir-muted">
            (optional)
          </span>
        </label>
        {coverImageUrl ? (
          <div className="relative block w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {/* biome-ignore lint/performance/noImgElement: dynamic S3/R2/local upload URL, not known at build time for next/image */}
            <img
              alt=""
              className="max-h-64 w-full rounded-ir-sm border border-ir-border bg-ir-muted-surface object-contain"
              src={coverImageUrl}
            />
            <button
              aria-label="Remove cover image"
              className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-ir-full border border-ir-border bg-ir-surface text-ir-danger shadow-ir-sm transition-opacity duration-150 ease-ir-standard hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40"
              onClick={removeCoverImage}
              type="button"
            >
              <XIcon className="size-3.5" />
            </button>
          </div>
        ) : (
          <label
            className={`flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-ir-input border border-dashed border-ir-border px-3 py-8 text-sm text-ir-muted transition-colors duration-150 ease-ir-standard hover:border-ir-primary/40 hover:text-ir-heading ${
              isUploadingCover ? "pointer-events-none opacity-50" : ""
            }`}
          >
            <ImageIcon className="size-4" />
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
        {coverError && <p className="text-xs text-ir-danger">{coverError}</p>}
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <label
          className="text-xs font-semibold uppercase tracking-wide text-ir-heading"
          htmlFor="title"
        >
          Title
        </label>
        <div className="relative">
          <input
            className="w-full rounded-ir-input border border-ir-border bg-ir-surface px-3 py-2.5 text-sm text-ir-body placeholder:text-ir-muted focus:ring-2 focus:ring-ir-primary/40 focus:outline-none"
            id="title"
            maxLength={200}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What shipped?"
            type="text"
            value={title}
          />
          <span className="absolute top-1/2 right-3 -translate-y-1/2 text-xs text-ir-muted">
            {title.length}/200
          </span>
        </div>
      </div>

      {/* Content — immediately after the title */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-ir-heading">
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
          className="text-xs font-semibold uppercase tracking-wide text-ir-heading"
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
                className={`cursor-pointer rounded-ir-sm border px-3 py-1.5 text-xs font-semibold transition-all duration-150 ease-ir-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40 ${
                  isActive
                    ? "border-current"
                    : "border-ir-border text-ir-muted hover:border-ir-primary/30"
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
                  className="rounded-ir-sm border border-ir-primary bg-ir-surface px-2 py-1.5 text-xs text-ir-body focus:ring-2 focus:ring-ir-primary/40 focus:outline-none"
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
                className={`inline-flex items-center gap-1 rounded-ir-sm border py-1.5 pr-1.5 pl-3 text-xs font-semibold transition-all duration-150 ease-ir-standard ${
                  isActive
                    ? "border-current"
                    : "border-ir-border text-ir-muted hover:border-ir-primary/30"
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
                  className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40"
                  onClick={() => setLabel(l.name)}
                  type="button"
                >
                  {l.name}
                </button>
                <button
                  aria-label={`Rename ${l.name}`}
                  className="text-ir-muted hover:text-ir-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40 disabled:opacity-50"
                  disabled={labelBusy}
                  onClick={() => {
                    setEditingLabelId(l.id);
                    setEditingLabelName(l.name);
                  }}
                  type="button"
                >
                  <PencilIcon className="size-3" />
                </button>
                <button
                  aria-label={`Delete ${l.name}`}
                  className="text-ir-muted hover:text-ir-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40 disabled:opacity-50"
                  disabled={labelBusy}
                  onClick={() => removeLabel(l.id, l.name)}
                  type="button"
                >
                  <XIcon className="size-3" />
                </button>
              </span>
            );
          })}

          {/* The selected label whose row was deleted — read-only. */}
          {orphanLabel && (
            <span
              className="rounded-ir-sm border border-current px-3 py-1.5 text-xs font-semibold"
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
            className="w-full max-w-xs rounded-ir-input border border-ir-border bg-ir-surface px-3 py-1.5 text-xs text-ir-body placeholder:text-ir-muted focus:ring-2 focus:ring-ir-primary/40 focus:outline-none"
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
          <Button
            className="shrink-0"
            disabled={!newLabel.trim() || labelBusy}
            onClick={addCustomLabel}
            size="sm"
            type="button"
            variant="outline"
          >
            {labelBusy ? "Saving…" : "Add"}
          </Button>
        </div>
        <div className="mt-1">
          <ChangelogLabelBadge label={label} size="md" />
        </div>
      </div>

      {/* Linked Posts */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-ir-heading">
          Linked Feedback Posts
          <span className="ml-1 font-normal normal-case text-ir-muted">
            (optional)
          </span>
        </label>
        <p className="text-xs text-ir-muted">
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
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ir-border pt-4">
        <div className="flex items-center gap-1.5">
          {saveStatus === "saving" && (
            <span className="animate-pulse text-xs text-ir-muted">Saving…</span>
          )}
          {saveStatus === "saved" && (
            <span className="text-xs text-ir-success">Saved</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {!isPublished && (
            <Button
              disabled={isPending || !title.trim()}
              onClick={handleSaveDraft}
              type="button"
              variant="outline"
            >
              Save Draft
            </Button>
          )}

          {isPublished ? (
            <Button
              disabled={isPending || !title.trim()}
              onClick={handleUpdate}
              type="button"
            >
              {isPending ? "Saving…" : "Update"}
            </Button>
          ) : (
            <Button
              disabled={isPending || !title.trim()}
              onClick={handlePublish}
              type="button"
            >
              {isPending ? "Publishing…" : "Publish →"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
