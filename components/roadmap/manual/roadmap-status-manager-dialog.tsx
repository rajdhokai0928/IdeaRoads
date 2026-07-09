"use client";

import { ArrowDown, ArrowUp, Check, Plus, Trash2, X } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createRoadmapStatusAction,
  deleteRoadmapStatusAction,
  reorderRoadmapStatusesAction,
  updateRoadmapStatusAction,
} from "@/app/actions/roadmap";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const COLOR_PRESETS = [
  "#6b7280",
  "#374151",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
];

export interface ManagerStatus {
  color: string;
  id: string;
  itemCount: number;
  name: string;
}

interface RoadmapStatusManagerDialogProps {
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  open: boolean;
  statuses: ManagerStatus[];
  workspaceId: string;
}

function ColorPicker({
  value,
  onChange,
}: {
  onChange: (c: string) => void;
  value: string;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {COLOR_PRESETS.map((c) => (
        <button
          className="size-5 rounded-full border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          key={c}
          onClick={() => onChange(c)}
          style={{
            backgroundColor: c,
            borderColor: value === c ? "var(--foreground)" : "transparent",
          }}
          title={c}
          type="button"
        />
      ))}
    </div>
  );
}

export function RoadmapStatusManagerDialog({
  open,
  onOpenChange,
  workspaceId,
  statuses,
  onSaved,
}: RoadmapStatusManagerDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("#6b7280");
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#3b82f6");

  function startEdit(s: ManagerStatus) {
    setEditingId(s.id);
    setEditName(s.name);
    setEditColor(s.color);
  }

  function saveEdit() {
    if (!editingId || !editName.trim()) {
      return;
    }
    startTransition(async () => {
      const res = await updateRoadmapStatusAction({
        workspaceId,
        statusId: editingId,
        name: editName.trim(),
        color: editColor,
      });
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      setEditingId(null);
      onSaved();
    });
  }

  function handleCreate() {
    if (!newName.trim()) {
      return;
    }
    startTransition(async () => {
      const res = await createRoadmapStatusAction({
        workspaceId,
        name: newName.trim(),
        color: newColor,
      });
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      setNewName("");
      onSaved();
    });
  }

  function handleDelete(s: ManagerStatus) {
    if (s.itemCount > 0) {
      toast.error(
        `Move or delete the ${s.itemCount} item${s.itemCount === 1 ? "" : "s"} in “${s.name}” first.`
      );
      return;
    }
    startTransition(async () => {
      const res = await deleteRoadmapStatusAction({
        workspaceId,
        statusId: s.id,
      });
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      onSaved();
    });
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= statuses.length) {
      return;
    }
    const ids = statuses.map((s) => s.id);
    [ids[index], ids[target]] = [ids[target]!, ids[index]!];
    startTransition(async () => {
      const res = await reorderRoadmapStatusesAction({
        workspaceId,
        orderedIds: ids,
      });
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      onSaved();
    });
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage columns</DialogTitle>
          <DialogDescription>
            Rename, recolor, reorder, or remove roadmap columns. A column must
            be empty before it can be deleted.
          </DialogDescription>
        </DialogHeader>

        <div className="divide-y divide-border border border-border">
          {statuses.map((s, i) => (
            <div className="p-3" key={s.id}>
              {editingId === s.id ? (
                <div className="space-y-2">
                  <input
                    className="w-full border border-border bg-background px-2.5 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    maxLength={48}
                    onChange={(e) => setEditName(e.target.value)}
                    value={editName}
                  />
                  <ColorPicker onChange={setEditColor} value={editColor} />
                  <div className="flex items-center gap-1.5">
                    <button
                      className="flex items-center gap-1 bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground disabled:opacity-50"
                      disabled={isPending || !editName.trim()}
                      onClick={saveEdit}
                      type="button"
                    >
                      <Check className="size-3" /> Save
                    </button>
                    <button
                      className="flex items-center gap-1 border border-border px-2.5 py-1 text-xs text-muted-foreground"
                      onClick={() => setEditingId(null)}
                      type="button"
                    >
                      <X className="size-3" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                  <button
                    className="min-w-0 flex-1 truncate text-left text-sm font-medium text-foreground hover:underline"
                    onClick={() => startEdit(s)}
                    type="button"
                  >
                    {s.name}
                  </button>
                  <span className="text-xs text-muted-foreground">
                    {s.itemCount}
                  </span>
                  <div className="flex items-center gap-0.5">
                    <button
                      aria-label="Move up"
                      className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                      disabled={isPending || i === 0}
                      onClick={() => move(i, -1)}
                      type="button"
                    >
                      <ArrowUp className="size-3.5" />
                    </button>
                    <button
                      aria-label="Move down"
                      className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                      disabled={isPending || i === statuses.length - 1}
                      onClick={() => move(i, 1)}
                      type="button"
                    >
                      <ArrowDown className="size-3.5" />
                    </button>
                    <button
                      aria-label="Delete column"
                      className="p-1 text-destructive hover:opacity-70 disabled:opacity-30"
                      disabled={isPending || s.itemCount > 0}
                      onClick={() => handleDelete(s)}
                      title={
                        s.itemCount > 0
                          ? "Empty this column first"
                          : "Delete column"
                      }
                      type="button"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add column */}
        <div className="space-y-2 border border-dashed border-border p-3">
          <p className="text-xs font-semibold text-foreground">Add column</p>
          <div className="flex items-center gap-2">
            <input
              className="min-w-0 flex-1 border border-border bg-background px-2.5 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              maxLength={48}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreate();
                }
              }}
              placeholder="Column name"
              value={newName}
            />
            <button
              className="flex items-center gap-1 bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
              disabled={isPending || !newName.trim()}
              onClick={handleCreate}
              type="button"
            >
              <Plus className="size-3.5" /> Add
            </button>
          </div>
          <ColorPicker onChange={setNewColor} value={newColor} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
