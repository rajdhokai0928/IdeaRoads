"use client";

import { Plus, Settings2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  deleteRoadmapItemAction,
  moveRoadmapItemAction,
} from "@/app/actions/roadmap";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SearchInput } from "@/components/ui/search-input";
import { AddRoadmapItemDialog } from "./add-roadmap-item-dialog";
import { type BoardItem, ManualRoadmapCard } from "./manual-roadmap-card";
import {
  type ManagerStatus,
  RoadmapStatusManagerDialog,
} from "./roadmap-status-manager-dialog";

export interface BoardStatus {
  color: string;
  id: string;
  itemCount: number;
  name: string;
}

interface ManualRoadmapBoardProps {
  canManage: boolean;
  items: BoardItem[];
  statuses: BoardStatus[];
  workspaceId: string;
}

type Cols = Record<string, BoardItem[]>;

function buildCols(statuses: BoardStatus[], items: BoardItem[]): Cols {
  const map: Cols = {};
  for (const s of statuses) {
    map[s.id] = [];
  }
  for (const it of items) {
    const arr = map[it.statusId];
    if (arr) {
      arr.push(it);
    } else {
      map[it.statusId] = [it];
    }
  }
  return map;
}

export function ManualRoadmapBoard({
  workspaceId,
  statuses,
  items,
  canManage,
}: ManualRoadmapBoardProps) {
  const router = useRouter();
  const [cols, setCols] = useState<Cols>(() => buildCols(statuses, items));
  const [drag, setDrag] = useState<BoardItem | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [addStatusId, setAddStatusId] = useState<string | undefined>();
  const [editItem, setEditItem] = useState<BoardItem | null>(null);
  const [manageOpen, setManageOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BoardItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [query, setQuery] = useState("");

  // Client-side filter over the loaded items (title + description). Dragging is
  // disabled while a filter is active so a reorder can never renumber a column
  // using a partial (filtered) view of its cards.
  const q = query.trim().toLowerCase();
  const isFiltering = q.length > 0;
  const dragEnabled = canManage && !isFiltering;
  const matchesQuery = (it: BoardItem) =>
    !q ||
    it.title.toLowerCase().includes(q) ||
    (it.description ?? "").toLowerCase().includes(q);

  // Re-seed local state whenever the server sends fresh data (after a refresh).
  useEffect(() => {
    setCols(buildCols(statuses, items));
  }, [statuses, items]);

  function performMove(item: BoardItem, targetStatusId: string, index: number) {
    const next: Cols = {};
    for (const s of statuses) {
      next[s.id] = cols[s.id] ? [...cols[s.id]!] : [];
    }
    const source = next[item.statusId];
    const posInSource = source?.findIndex((i) => i.id === item.id) ?? -1;
    // No-op when dropped back onto its exact spot.
    if (
      item.statusId === targetStatusId &&
      posInSource !== -1 &&
      (index === posInSource || index === posInSource + 1)
    ) {
      return;
    }
    if (source) {
      next[item.statusId] = source.filter((i) => i.id !== item.id);
    }
    const target = next[targetStatusId] ?? [];
    const clampedIndex = Math.max(0, Math.min(index, target.length));
    target.splice(clampedIndex, 0, { ...item, statusId: targetStatusId });
    next[targetStatusId] = target;
    setCols(next);

    const orderedIds = target.map((i) => i.id);
    (async () => {
      const res = await moveRoadmapItemAction({
        workspaceId,
        itemId: item.id,
        statusId: targetStatusId,
        orderedIds,
      });
      if (!res.success) {
        toast.error(res.error);
        setCols(buildCols(statuses, items));
        return;
      }
      router.refresh();
    })();
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) {
      return;
    }
    setIsDeleting(true);
    (async () => {
      const res = await deleteRoadmapItemAction({
        workspaceId,
        itemId: deleteTarget.id,
      });
      setIsDeleting(false);
      setDeleteTarget(null);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success("Item deleted");
      router.refresh();
    })();
  }

  const managerStatuses: ManagerStatus[] = statuses.map((s) => ({
    id: s.id,
    name: s.name,
    color: s.color,
    itemCount: (cols[s.id] ?? []).length,
  }));

  const totalItems = Object.values(cols).reduce((n, arr) => n + arr.length, 0);

  return (
    <div className="flex flex-col">
      {canManage && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-2 pb-4">
          <p className="text-xs text-muted-foreground">
            Manual roadmap · {totalItems} item{totalItems === 1 ? "" : "s"} ·
            drag cards between columns
          </p>
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-1.5 border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => setManageOpen(true)}
              type="button"
            >
              <Settings2 className="size-4" />
              Manage columns
            </button>
            <button
              className="flex items-center gap-1.5 bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={statuses.length === 0}
              onClick={() => {
                setAddStatusId(undefined);
                setEditItem(null);
                setAddOpen(true);
              }}
              type="button"
            >
              <Plus className="size-4" />
              Add Roadmap Item
            </button>
          </div>
        </div>
      )}

      {statuses.length > 0 && (
        <div className="px-6 pb-4">
          <SearchInput
            aria-label="Search roadmap items"
            className="h-9 min-w-50 max-w-md"
            onSearch={setQuery}
            placeholder="Search roadmap items"
          />
        </div>
      )}

      <div className="px-6 pb-12">
        {statuses.length === 0 ? (
          <div className="border border-dashed border-border px-4 py-16 text-center text-sm text-muted-foreground">
            No roadmap columns yet.
            {canManage && (
              <button
                className="ml-1 text-primary underline"
                onClick={() => setManageOpen(true)}
                type="button"
              >
                Add one
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-6 md:flex-row md:flex-wrap md:items-start md:overflow-x-auto md:pb-2">
            {statuses.map((s) => {
              // Filter for DISPLAY only. performMove always reads the full,
              // unfiltered `cols`, and dragging is off while filtering, so the
              // filter can never corrupt column ordering.
              const columnItems = (cols[s.id] ?? []).filter(matchesQuery);
              const isDropTarget = dropTarget === s.id;
              return (
                <div
                  className="flex w-full min-w-0 flex-col md:w-80 md:shrink-0"
                  key={s.id}
                >
                  <div
                    className="mb-3 flex items-center justify-between gap-2 border border-border px-4 py-3"
                    style={{ backgroundColor: `${s.color}12` }}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="inline-block size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      <h2 className="truncate text-sm font-semibold text-foreground">
                        {s.name}
                      </h2>
                    </div>
                    <span
                      className="inline-flex shrink-0 items-center px-2 py-0.5 text-xs font-semibold"
                      style={{
                        backgroundColor: `${s.color}20`,
                        color: s.color,
                      }}
                    >
                      {columnItems.length}
                    </span>
                  </div>

                  {/* Drop zone. Keyboard users reorder/move via the item Edit
                      dialog's Column selector and the Manage-columns controls;
                      drag is a pointer-only enhancement. */}
                  {/* biome-ignore lint/a11y/noStaticElementInteractions: native drop zone */}
                  {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: native drop zone */}
                  <div
                    className={`flex min-h-24 flex-col gap-2 border border-dashed p-1 transition-colors ${
                      isDropTarget && canManage
                        ? "border-primary/60 bg-primary/5"
                        : "border-transparent"
                    }`}
                    onDragLeave={() => canManage && setDropTarget(null)}
                    onDragOver={(e) => {
                      if (!canManage || !drag) {
                        return;
                      }
                      e.preventDefault();
                      setDropTarget(s.id);
                    }}
                    onDrop={(e) => {
                      if (!canManage || !drag) {
                        return;
                      }
                      e.preventDefault();
                      performMove(drag, s.id, columnItems.length);
                      setDrag(null);
                      setDropTarget(null);
                    }}
                  >
                    {columnItems.length === 0 ? (
                      <div className="px-3 py-8 text-center text-xs text-muted-foreground/70">
                        {isFiltering
                          ? "No matches"
                          : canManage
                            ? "Drop items here"
                            : "Nothing here yet."}
                      </div>
                    ) : (
                      columnItems.map((item, index) => (
                        // biome-ignore lint/a11y/noStaticElementInteractions: native draggable card
                        // biome-ignore lint/a11y/noNoninteractiveElementInteractions: native draggable card
                        <div
                          draggable={dragEnabled}
                          key={item.id}
                          onDragEnd={() => {
                            setDrag(null);
                            setDropTarget(null);
                          }}
                          onDragOver={(e) => {
                            if (!dragEnabled || !drag) {
                              return;
                            }
                            e.preventDefault();
                            e.stopPropagation();
                            setDropTarget(s.id);
                          }}
                          onDragStart={(e) => {
                            if (!dragEnabled) {
                              return;
                            }
                            e.dataTransfer.effectAllowed = "move";
                            setDrag(item);
                          }}
                          onDrop={(e) => {
                            if (!canManage || !drag) {
                              return;
                            }
                            e.preventDefault();
                            e.stopPropagation();
                            performMove(drag, s.id, index);
                            setDrag(null);
                            setDropTarget(null);
                          }}
                        >
                          <ManualRoadmapCard
                            canManage={canManage}
                            dragging={drag?.id === item.id}
                            item={item}
                            onDelete={setDeleteTarget}
                            onEdit={(it) => {
                              setEditItem(it);
                              setAddOpen(false);
                            }}
                          />
                        </div>
                      ))
                    )}

                    {canManage && (
                      <button
                        className="mt-1 flex items-center justify-center gap-1 border border-dashed border-border py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={() => {
                          setEditItem(null);
                          setAddStatusId(s.id);
                          setAddOpen(true);
                        }}
                        type="button"
                      >
                        <Plus className="size-3.5" /> Add item
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {canManage && (
        <>
          <AddRoadmapItemDialog
            defaultStatusId={addStatusId}
            onOpenChange={setAddOpen}
            onSaved={() => router.refresh()}
            open={addOpen}
            statuses={statuses}
            workspaceId={workspaceId}
          />
          <AddRoadmapItemDialog
            item={editItem}
            onOpenChange={(o) => !o && setEditItem(null)}
            onSaved={() => router.refresh()}
            open={!!editItem}
            statuses={statuses}
            workspaceId={workspaceId}
          />
          <RoadmapStatusManagerDialog
            onOpenChange={setManageOpen}
            onSaved={() => router.refresh()}
            open={manageOpen}
            statuses={managerStatuses}
            workspaceId={workspaceId}
          />
          <ConfirmDialog
            confirmLabel="Delete"
            description={`Delete “${deleteTarget?.title}”? This cannot be undone.`}
            isPending={isDeleting}
            onConfirm={handleDeleteConfirm}
            onOpenChange={(o) => !o && setDeleteTarget(null)}
            open={!!deleteTarget}
            title="Delete roadmap item"
            variant="destructive"
          />
        </>
      )}
    </div>
  );
}
