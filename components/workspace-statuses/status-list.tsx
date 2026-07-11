"use client";

import {
  ArchiveIcon,
  EyeIcon,
  EyeSlashIcon,
  MapTrifoldIcon,
  PencilIcon,
  PlusIcon,
  StarIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createWorkspaceStatusAction,
  deleteWorkspaceStatusAction,
  setDefaultStatusAction,
  updateWorkspaceStatusAction,
} from "@/app/actions/workspace-statuses";
import { Button } from "@/components/ui/button";
import { ColorSwatchPicker } from "@/components/ui/color-swatch-picker";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { ContentContainer, PageHeader } from "@/components/ui/page";

interface WorkspaceStatus {
  color: string;
  displayOrder: number;
  id: string;
  isArchived: boolean;
  isDefault: boolean;
  name: string;
  showOnPublicFeed: boolean;
  showOnRoadmap: boolean;
  slug: string;
}

interface StatusListProps {
  canManage: boolean;
  statuses: WorkspaceStatus[];
  workspaceId: string;
}

interface FormState {
  color: string;
  mode: "create" | "edit";
  name: string;
  statusId?: string;
}

const DEFAULT_FORM: FormState = {
  mode: "create",
  name: "",
  color: "#6b7280",
};

export function StatusList({
  statuses,
  workspaceId,
  canManage,
}: StatusListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<FormState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WorkspaceStatus | null>(
    null
  );
  const [archiveTarget, setArchiveTarget] = useState<WorkspaceStatus | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  function openCreate() {
    setForm({ ...DEFAULT_FORM });
    setError(null);
  }

  function openEdit(s: WorkspaceStatus) {
    setForm({ mode: "edit", statusId: s.id, name: s.name, color: s.color });
    setError(null);
  }

  function closeForm() {
    setForm(null);
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) {
      return;
    }
    const trimmedName = form.name.trim();
    if (!trimmedName) {
      setError("Name is required.");
      return;
    }

    startTransition(async () => {
      let result;
      if (form.mode === "create") {
        result = await createWorkspaceStatusAction({
          workspaceId,
          name: trimmedName,
          color: form.color,
        });
      } else {
        result = await updateWorkspaceStatusAction({
          statusId: form.statusId!,
          workspaceId,
          name: trimmedName,
          color: form.color,
        });
      }

      if (!result.success) {
        setError(result.error);
        return;
      }

      toast.success(
        form.mode === "create" ? "Status created" : "Status updated"
      );
      closeForm();
      router.refresh();
    });
  }

  function handleToggleRoadmap(s: WorkspaceStatus) {
    startTransition(async () => {
      const result = await updateWorkspaceStatusAction({
        statusId: s.id,
        workspaceId,
        showOnRoadmap: !s.showOnRoadmap,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(
        s.showOnRoadmap
          ? `"${s.name}" hidden from the roadmap`
          : `"${s.name}" now shows on the roadmap`
      );
      router.refresh();
    });
  }

  function handleTogglePublicFeed(s: WorkspaceStatus) {
    startTransition(async () => {
      const result = await updateWorkspaceStatusAction({
        statusId: s.id,
        workspaceId,
        showOnPublicFeed: !s.showOnPublicFeed,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(
        s.showOnPublicFeed
          ? `"${s.name}" hidden from the public feed`
          : `"${s.name}" now shows on the public feed`
      );
      router.refresh();
    });
  }

  function handleSetDefault(s: WorkspaceStatus) {
    startTransition(async () => {
      const result = await setDefaultStatusAction({
        statusId: s.id,
        workspaceId,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(`"${s.name}" is now the default status`);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!deleteTarget) {
      return;
    }
    startTransition(async () => {
      const result = await deleteWorkspaceStatusAction({
        statusId: deleteTarget.id,
        workspaceId,
      });
      setDeleteTarget(null);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Status deleted");
      router.refresh();
    });
  }

  function handleArchiveToggle() {
    if (!archiveTarget) {
      return;
    }
    startTransition(async () => {
      const result = await updateWorkspaceStatusAction({
        statusId: archiveTarget.id,
        workspaceId,
        isArchived: !archiveTarget.isArchived,
      });
      setArchiveTarget(null);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(
        archiveTarget.isArchived ? "Status restored" : "Status archived"
      );
      router.refresh();
    });
  }

  const active = statuses.filter((s) => !s.isArchived);
  const archived = statuses.filter((s) => s.isArchived);

  return (
    <div className="flex h-full flex-col">
      {/* Page header — title/description on the left, New Status on the right */}
      <PageHeader
        actions={
          canManage && !form ? (
            <Button onClick={openCreate}>
              <PlusIcon data-icon="inline-start" />
              New Status
            </Button>
          ) : undefined
        }
        description="Manage the statuses available for feedback posts in this workspace."
        title="Statuses"
      />

      <ContentContainer className="flex-1 space-y-6">
        {/* Inline form */}
        {form && canManage && (
          <form
            className="space-y-4 rounded-ir-card border border-ir-border bg-ir-surface p-4 shadow-ir-xs"
            onSubmit={handleSubmit}
          >
            <h3 className="text-sm font-semibold text-ir-heading">
              {form.mode === "create" ? "New Status" : "Edit Status"}
            </h3>

            <div className="space-y-3">
              <div>
                <label
                  className="mb-1 block text-xs font-medium text-ir-heading"
                  htmlFor="status-name"
                >
                  Name <span className="text-ir-danger">*</span>
                </label>
                <Input
                  id="status-name"
                  maxLength={48}
                  onChange={(e) =>
                    setForm((f) => f && { ...f, name: e.target.value })
                  }
                  placeholder="e.g. Needs More Info"
                  type="text"
                  value={form.name}
                />
              </div>

              <div>
                <span className="mb-2 block text-xs font-medium text-ir-heading">
                  Color
                </span>
                <ColorSwatchPicker
                  onChange={(c) => setForm((f) => f && { ...f, color: c })}
                  value={form.color}
                />
                {form.name && (
                  <div className="mt-2">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-ir-sm px-2 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: `${form.color}18`,
                        color: form.color,
                      }}
                    >
                      <span
                        className="inline-block h-1.5 w-1.5 rounded-ir-full"
                        style={{ backgroundColor: form.color }}
                      />
                      {form.name || "Preview"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {error && <p className="text-xs text-ir-danger">{error}</p>}

            <div className="flex items-center gap-2">
              <Button disabled={isPending} type="submit">
                {isPending
                  ? "Saving…"
                  : form.mode === "create"
                    ? "Create"
                    : "Save Changes"}
              </Button>
              <Button
                disabled={isPending}
                onClick={closeForm}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {/* Active statuses */}
        {active.length === 0 && !form ? (
          <div className="rounded-ir-card border border-dashed border-ir-border py-12 text-center">
            <p className="text-sm text-ir-muted">No statuses found.</p>
          </div>
        ) : (
          active.length > 0 && (
            <div className="divide-y divide-ir-border overflow-hidden rounded-ir-card border border-ir-border bg-ir-surface shadow-ir-xs">
              {active.map((s) => (
                <div
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-4 transition-colors duration-150 ease-ir-standard hover:bg-ir-muted-surface"
                  key={s.id}
                >
                  <span
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-ir-sm px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: `${s.color}18`,
                      color: s.color,
                    }}
                  >
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-ir-full"
                      style={{ backgroundColor: s.color }}
                    />
                    {s.name}
                  </span>

                  {s.isDefault && (
                    <span className="flex items-center gap-1 rounded-ir-sm border border-ir-border px-1.5 py-0.5 text-2xs font-medium text-ir-muted">
                      <StarIcon className="size-2.5" />
                      Default
                    </span>
                  )}

                  {canManage && (
                    <div className="ml-auto flex items-center gap-1.5">
                      <button
                        aria-pressed={s.showOnPublicFeed}
                        className={`inline-flex items-center gap-1 rounded-ir-sm border px-1.5 py-0.5 text-2xs font-medium transition-colors duration-150 ease-ir-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40 ${
                          s.showOnPublicFeed
                            ? "border-ir-primary/40 bg-ir-primary-light/15 text-ir-primary"
                            : "border-ir-border text-ir-muted hover:text-ir-heading"
                        }`}
                        disabled={isPending}
                        onClick={() => handleTogglePublicFeed(s)}
                        title="Show posts with this status in the public feedback list (they always stay visible in the admin panel)"
                        type="button"
                      >
                        {s.showOnPublicFeed ? (
                          <EyeIcon className="size-2.5" />
                        ) : (
                          <EyeSlashIcon className="size-2.5" />
                        )}
                        Public Feed
                        <span className="opacity-70">
                          {s.showOnPublicFeed ? "On" : "Off"}
                        </span>
                      </button>
                      <button
                        aria-pressed={s.showOnRoadmap}
                        className={`inline-flex items-center gap-1 rounded-ir-sm border px-1.5 py-0.5 text-2xs font-medium transition-colors duration-150 ease-ir-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40 ${
                          s.showOnRoadmap
                            ? "border-ir-primary/40 bg-ir-primary-light/15 text-ir-primary"
                            : "border-ir-border text-ir-muted hover:text-ir-heading"
                        }`}
                        disabled={isPending}
                        onClick={() => handleToggleRoadmap(s)}
                        title="Show this status as a column on the roadmap (Sync from Feedback mode)"
                        type="button"
                      >
                        <MapTrifoldIcon className="size-2.5" />
                        Roadmap
                        <span className="opacity-70">
                          {s.showOnRoadmap ? "On" : "Off"}
                        </span>
                      </button>
                    </div>
                  )}

                  {canManage && (
                    <div className="flex shrink-0 items-center gap-1">
                      {!s.isDefault && (
                        <button
                          aria-label={`Set ${s.name} as default`}
                          className="rounded-ir-xs p-1.5 text-ir-muted transition-colors duration-150 ease-ir-standard hover:text-ir-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40"
                          disabled={isPending}
                          onClick={() => handleSetDefault(s)}
                          title="Set as default"
                          type="button"
                        >
                          <StarIcon className="size-3.5" />
                        </button>
                      )}
                      <button
                        aria-label={`Edit ${s.name}`}
                        className="rounded-ir-xs p-1.5 text-ir-primary transition-opacity duration-150 ease-ir-standard hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40"
                        onClick={() => openEdit(s)}
                        title="Edit"
                        type="button"
                      >
                        <PencilIcon className="size-3.5" />
                      </button>
                      <button
                        aria-label={`Archive ${s.name}`}
                        className="rounded-ir-xs p-1.5 text-ir-muted transition-colors duration-150 ease-ir-standard hover:text-ir-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40"
                        onClick={() => setArchiveTarget(s)}
                        title="Archive"
                        type="button"
                      >
                        <ArchiveIcon className="size-3.5" />
                      </button>
                      {!s.isDefault && (
                        <button
                          aria-label={`Delete ${s.name}`}
                          className="rounded-ir-xs p-1.5 text-ir-danger transition-opacity duration-150 ease-ir-standard hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40"
                          onClick={() => setDeleteTarget(s)}
                          title="Delete"
                          type="button"
                        >
                          <TrashIcon className="size-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}

        {/* Archived statuses */}
        {archived.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold tracking-wider text-ir-muted uppercase">
              Archived
            </p>
            <div className="divide-y divide-ir-border overflow-hidden rounded-ir-card border border-ir-border bg-ir-surface opacity-60">
              {archived.map((s) => (
                <div
                  className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:gap-4"
                  key={s.id}
                >
                  <span
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-ir-sm px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: `${s.color}18`,
                      color: s.color,
                    }}
                  >
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-ir-full"
                      style={{ backgroundColor: s.color }}
                    />
                    {s.name}
                  </span>
                  {canManage && (
                    <div className="flex shrink-0 items-center gap-1 sm:ml-auto">
                      <button
                        aria-label={`Restore ${s.name}`}
                        className="rounded-ir-xs p-1.5 text-xs text-ir-muted transition-colors duration-150 ease-ir-standard hover:text-ir-heading focus-visible:outline-none"
                        onClick={() => setArchiveTarget(s)}
                        type="button"
                      >
                        Restore
                      </button>
                      <button
                        aria-label={`Delete ${s.name}`}
                        className="rounded-ir-xs p-1.5 text-ir-danger transition-opacity duration-150 ease-ir-standard hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40"
                        onClick={() => setDeleteTarget(s)}
                        type="button"
                      >
                        <TrashIcon className="size-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Confirm delete */}
        <ConfirmDialog
          confirmLabel="Delete"
          description={`Delete "${deleteTarget?.name}"? Posts with this status will keep their status slug but it won't appear in selections. This action cannot be undone.`}
          isPending={isPending}
          onConfirm={handleDelete}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          open={!!deleteTarget}
          title="Delete Status"
          variant="destructive"
        />

        {/* Confirm archive/restore */}
        <ConfirmDialog
          confirmLabel={archiveTarget?.isArchived ? "Restore" : "Archive"}
          description={
            archiveTarget?.isArchived
              ? `Restore "${archiveTarget?.name}"? It will be available for post selections again.`
              : `Archive "${archiveTarget?.name}"? It will be hidden from post status selections.`
          }
          isPending={isPending}
          onConfirm={handleArchiveToggle}
          onOpenChange={(open) => !open && setArchiveTarget(null)}
          open={!!archiveTarget}
          title={
            archiveTarget?.isArchived ? "Restore Status" : "Archive Status"
          }
          variant="default"
        />
      </ContentContainer>
    </div>
  );
}
