"use client";

import {
  CalendarBlankIcon,
  ChatCircleIcon,
  DotsSixVerticalIcon,
  PencilIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { format } from "date-fns";

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
  onView?: (item: BoardItem) => void;
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
  onView,
  dragging,
}: ManualRoadmapCardProps) {
  const launch = formatLaunch(item.launchDate);
  const descPreview = item.description ? htmlToText(item.description) : "";

  return (
    <div
      className={`group relative rounded-ir-card border border-ir-border bg-ir-surface shadow-ir-xs transition-all duration-150 ease-ir-standard hover:border-ir-primary/30 hover:shadow-ir-sm ${
        dragging ? "opacity-50 ring-2 ring-ir-primary" : ""
      }`}
    >
      {item.coverImage && (
        // Cover image is an arbitrary user-supplied external URL (like the
        // workspace logo field) — next/image can't optimize unknown hosts.
        // biome-ignore lint/performance/noImgElement: external user-supplied URL
        <img
          alt=""
          className="h-28 w-full rounded-t-ir-card border-b border-ir-border object-cover"
          src={item.coverImage}
        />
      )}

      <div className="p-3.5">
        <div className="flex items-start gap-2">
          {canManage && (
            <DotsSixVerticalIcon
              aria-hidden
              className="mt-0.5 size-4 shrink-0 cursor-grab text-ir-muted/50 group-hover:text-ir-muted"
            />
          )}
          <div className="min-w-0 flex-1">
            {/* The whole card opens the read-only detail view — same pattern
                as the derived-mode card's stretched title link, just backed
                by a dialog instead of navigation (manual items have no
                detail route). */}
            <button
              className="text-left text-sm leading-snug font-medium text-ir-heading after:absolute after:inset-0 after:content-[''] hover:text-ir-primary hover:underline focus-visible:underline focus-visible:outline-none"
              onClick={() => onView?.(item)}
              type="button"
            >
              {item.title}
            </button>
            {descPreview && (
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ir-muted">
                {descPreview}
              </p>
            )}

            <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1.5">
              {launch && (
                <span className="inline-flex items-center gap-1 rounded-ir-full bg-ir-primary-light/15 px-1.5 py-0.5 text-[11px] font-medium text-ir-primary">
                  <CalendarBlankIcon className="size-3" />
                  {launch}
                </span>
              )}
              {item.voteCount > 0 && (
                <span className="flex items-center gap-1 text-[11px] text-ir-muted">
                  <span aria-hidden>▲</span>
                  {item.voteCount}
                </span>
              )}
              {item.commentCount > 0 && (
                <span className="flex items-center gap-1 text-[11px] text-ir-muted">
                  <ChatCircleIcon className="size-3" />
                  {item.commentCount}
                </span>
              )}
            </div>
          </div>

          {canManage && (onEdit || onDelete) && (
            <div className="relative z-10 flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
              {onEdit && (
                <button
                  aria-label="Edit item"
                  className="rounded-ir-sm p-1.5 text-ir-muted transition-colors duration-150 ease-ir-standard hover:bg-ir-muted-surface hover:text-ir-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40"
                  onClick={() => onEdit(item)}
                  type="button"
                >
                  <PencilIcon className="size-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  aria-label="Delete item"
                  className="rounded-ir-sm p-1.5 text-ir-danger transition-colors duration-150 ease-ir-standard hover:bg-ir-danger/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40"
                  onClick={() => onDelete(item)}
                  type="button"
                >
                  <TrashIcon className="size-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
