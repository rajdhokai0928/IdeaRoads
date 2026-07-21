"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { updatePostStatusAction } from "@/app/actions/posts";
import type { RoadmapPost, RoadmapStatusColumn } from "@/lib/roadmap/queries";
import { RoadmapColumn } from "./roadmap-column";

interface RoadmapBoardProps {
  // Only the admin-shelled /settings/roadmap page passes this — dragging a
  // card to another column changes the post's status (triage, permitted for
  // any workspace member per PLATFORM.md §4). The public /roadmap page never
  // sets this; it's read-only for visitors.
  canManage?: boolean;
  columns: RoadmapStatusColumn[];
  // Threaded through to each card's post-detail link so opening an item from
  // the embedded roadmap stays inside the widget instead of dropping back to
  // full Public Portal chrome. Empty/undefined outside the embed.
  embedQuery?: string;
  // Whether a category/search filter is currently narrowing `columns` — an
  // empty column reads differently ("No matches") than a genuinely empty
  // roadmap ("Nothing in {name} yet.").
  isFiltering?: boolean;
  isSignedIn: boolean;
  // Fixed per-route, never per-viewer: true only on the admin-shelled
  // /settings/roadmap page. The public /roadmap page never sets this, even
  // for signed-in members — the public portal must never redirect into the
  // workspace app on its own.
  useWorkspaceLinks?: boolean;
  workspaceId?: string;
  workspaceSlug: string;
}

type Cols = Record<string, RoadmapPost[]>;

function buildCols(columns: RoadmapStatusColumn[]): Cols {
  const map: Cols = {};
  for (const c of columns) {
    map[c.id] = c.posts;
  }
  return map;
}

export function RoadmapBoard({
  columns,
  workspaceSlug,
  workspaceId,
  isSignedIn,
  isFiltering = false,
  useWorkspaceLinks,
  canManage,
  embedQuery,
}: RoadmapBoardProps) {
  const router = useRouter();
  const [cols, setCols] = useState<Cols>(() => buildCols(columns));
  const [drag, setDrag] = useState<{ colId: string; post: RoadmapPost } | null>(
    null
  );
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  // Re-seed local state whenever the server sends fresh data (after a refresh
  // or a search/filter change).
  useEffect(() => {
    setCols(buildCols(columns));
  }, [columns]);

  function performMove(sourceColId: string, targetCol: RoadmapStatusColumn) {
    const post = cols[sourceColId]?.find((p) => p.id === drag?.post.id);
    if (!post || !workspaceId || sourceColId === targetCol.id) {
      return;
    }

    const previous = cols;
    setCols((prev) => {
      const next: Cols = { ...prev };
      next[sourceColId] = (prev[sourceColId] ?? []).filter(
        (p) => p.id !== post.id
      );
      next[targetCol.id] = [
        { ...post, status: targetCol.slug },
        ...(prev[targetCol.id] ?? []),
      ];
      return next;
    });

    (async () => {
      const res = await updatePostStatusAction({
        postId: post.id,
        workspaceId,
        status: targetCol.slug,
      });
      if (!res.success) {
        toast.error(res.error);
        setCols(previous);
        return;
      }
      toast.success(`Moved to ${targetCol.name}`);
      router.refresh();
    })();
  }

  return (
    <div className="px-6 pb-12">
      {canManage && columns.length > 0 && (
        <p className="mt-4 mb-2 text-xs text-ir-muted">
          Drag a card into another column to change its status.
        </p>
      )}

      {columns.length === 0 ? (
        <div className="mt-4 rounded-ir-card border border-dashed border-ir-border px-4 py-16 text-center text-sm text-ir-muted">
          No roadmap columns yet. Add feedback statuses to populate the roadmap.
        </div>
      ) : (
        // Responsive grid: 1 column on mobile, 2 on tablet, 3 on desktop —
        // a 4th+ column wraps to a new row instead of squeezing into one.
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {columns.map((col) => (
            <RoadmapColumn
              canManage={canManage}
              color={col.color}
              draggingId={drag?.post.id ?? null}
              embedQuery={embedQuery}
              isDropTarget={dropTarget === col.id}
              isFiltering={isFiltering}
              isSignedIn={isSignedIn}
              key={col.id}
              name={col.name}
              onDragEnd={() => {
                setDrag(null);
                setDropTarget(null);
              }}
              onDragLeaveColumn={() => setDropTarget(null)}
              onDragOverColumn={() => drag && setDropTarget(col.id)}
              onDragStartPost={(post) => setDrag({ colId: col.id, post })}
              onDropColumn={() => {
                if (drag) {
                  performMove(drag.colId, col);
                }
                setDrag(null);
                setDropTarget(null);
              }}
              posts={cols[col.id] ?? []}
              useWorkspaceLinks={useWorkspaceLinks}
              workspaceSlug={workspaceSlug}
            />
          ))}
        </div>
      )}
    </div>
  );
}
