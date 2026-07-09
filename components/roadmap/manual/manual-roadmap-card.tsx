"use client";

import { format } from "date-fns";
import {
  CalendarDays,
  GripVertical,
  MessageSquare,
  Pencil,
  Trash2,
} from "lucide-react";

export interface BoardItem {
  commentCount: number;
  coverImage: string | null;
  description: string | null;
  feedbackId: string | null;
  id: string;
  launchDate: string | null;
  statusId: string;
  title: string;
  voteCount: number;
}

interface ManualRoadmapCardProps {
  canManage: boolean;
  dragging?: boolean;
  item: BoardItem;
  onDelete?: (item: BoardItem) => void;
  onEdit?: (item: BoardItem) => void;
}

function formatLaunch(iso: string | null): string | null {
  if (!iso) {
    return null;
  }
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : format(d, "MMM d, yyyy");
}

// Descriptions are stored as rich-text HTML (Quill). The compact card shows a
// plain-text preview, so strip tags and collapse whitespace — old plain-text
// descriptions pass through unchanged.
function htmlToText(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function ManualRoadmapCard({
  item,
  canManage,
  onEdit,
  onDelete,
  dragging,
}: ManualRoadmapCardProps) {
  const launch = formatLaunch(item.launchDate);
  const descPreview = item.description ? htmlToText(item.description) : "";

  return (
    <div
      className={`group relative border border-border bg-background transition-all duration-150 hover:border-border/80 hover:shadow-sm ${
        dragging ? "opacity-50 ring-2 ring-ring" : ""
      }`}
    >
      {item.coverImage && (
        // Cover image is an arbitrary user-supplied external URL (like the
        // workspace logo field) — next/image can't optimize unknown hosts.
        // biome-ignore lint/performance/noImgElement: external user-supplied URL
        <img
          alt=""
          className="h-28 w-full border-b border-border object-cover"
          src={item.coverImage}
        />
      )}

      <div className="p-3.5">
        <div className="flex items-start gap-2">
          {canManage && (
            <GripVertical
              aria-hidden
              className="mt-0.5 size-4 shrink-0 cursor-grab text-muted-foreground/40 group-hover:text-muted-foreground/70"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium leading-snug text-foreground">
              {item.title}
            </p>
            {descPreview && (
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                {descPreview}
              </p>
            )}

            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              {launch && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <CalendarDays className="size-3" />
                  {launch}
                </span>
              )}
              {item.voteCount > 0 && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <span aria-hidden>▲</span>
                  {item.voteCount}
                </span>
              )}
              {item.commentCount > 0 && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <MessageSquare className="size-3" />
                  {item.commentCount}
                </span>
              )}
            </div>
          </div>

          {canManage && (onEdit || onDelete) && (
            <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
              {onEdit && (
                <button
                  aria-label="Edit item"
                  className="p-1.5 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => onEdit(item)}
                  type="button"
                >
                  <Pencil className="size-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  aria-label="Delete item"
                  className="p-1.5 text-destructive hover:opacity-70 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => onDelete(item)}
                  type="button"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
