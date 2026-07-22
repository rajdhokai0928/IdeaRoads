"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import type { RoadmapPost } from "@/lib/roadmap/queries";
import { RoadmapEmptyState } from "./roadmap-empty-state";
import { RoadmapPostCard } from "./roadmap-post-card";
import { RoadmapStatusHeader } from "./roadmap-status-header";

const PAGE_SIZE = 10;

interface RoadmapColumnProps {
  // Drag-and-drop is an opt-in enhancement, only wired up by the admin-shelled
  // board (see RoadmapBoard) — the public roadmap page never passes these.
  canManage?: boolean;
  color: string;
  draggingId?: string | null;
  embedQuery?: string;
  isDropTarget?: boolean;
  isFiltering?: boolean;
  isSignedIn: boolean;
  name: string;
  onDragEnd?: () => void;
  onDragLeaveColumn?: () => void;
  onDragOverColumn?: () => void;
  onDragStartPost?: (post: RoadmapPost) => void;
  onDropColumn?: () => void;
  posts: RoadmapPost[];
  useWorkspaceLinks?: boolean;
  workspaceSlug: string;
}

export function RoadmapColumn({
  name,
  color,
  posts,
  workspaceSlug,
  isSignedIn,
  useWorkspaceLinks,
  embedQuery,
  canManage = false,
  draggingId = null,
  isDropTarget = false,
  isFiltering = false,
  onDragEnd,
  onDragLeaveColumn,
  onDragOverColumn,
  onDragStartPost,
  onDropColumn,
}: RoadmapColumnProps) {
  const shouldReduceMotion = useReducedMotion();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visible = posts.slice(0, visibleCount);
  const hasMore = posts.length > visibleCount;

  return (
    <div className="flex w-full min-w-0 flex-col">
      <RoadmapStatusHeader color={color} count={posts.length} name={name} />

      {/* Drop zone. Keyboard/non-pointer users change status via the post's own
          status control elsewhere (e.g. All Feedback) — drag here is a
          pointer-only enhancement, matching the manual roadmap board. */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: native drop zone, opt-in via canManage */}
      {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: native drop zone, opt-in via canManage */}
      <div
        className={`flex min-h-16 flex-col gap-2 rounded-ir-md p-1 transition-colors duration-150 ease-ir-standard ${
          isDropTarget && canManage
            ? "border border-dashed border-ir-primary/60 bg-ir-primary-light/10"
            : "border border-dashed border-transparent"
        }`}
        onDragLeave={() => canManage && onDragLeaveColumn?.()}
        onDragOver={(e) => {
          if (!canManage) {
            return;
          }
          e.preventDefault();
          onDragOverColumn?.();
        }}
        onDrop={(e) => {
          if (!canManage) {
            return;
          }
          e.preventDefault();
          onDropColumn?.();
        }}
      >
        {visible.length === 0 ? (
          <div className="rounded-ir-card border border-dashed border-ir-border">
            <RoadmapEmptyState
              label={isFiltering ? "No matches" : `Nothing in ${name} yet.`}
            />
          </div>
        ) : (
          <>
            <AnimatePresence initial={false}>
              {visible.map((post) => (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  exit={shouldReduceMotion ? undefined : { opacity: 0 }}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
                  key={post.id}
                  layout={!shouldReduceMotion}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                >
                  {/* biome-ignore lint/a11y/noStaticElementInteractions: native draggable card, opt-in via canManage */}
                  {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: native draggable card, opt-in via canManage */}
                  <div
                    className={
                      canManage && draggingId === post.id
                        ? "rounded-ir-card opacity-50 ring-2 ring-ir-primary"
                        : undefined
                    }
                    draggable={canManage}
                    onDragEnd={() => canManage && onDragEnd?.()}
                    onDragStart={(e) => {
                      if (!canManage) {
                        return;
                      }
                      e.dataTransfer.effectAllowed = "move";
                      onDragStartPost?.(post);
                    }}
                  >
                    <RoadmapPostCard
                      canManage={canManage}
                      embedQuery={embedQuery}
                      isSignedIn={isSignedIn}
                      post={post}
                      useWorkspaceLinks={useWorkspaceLinks}
                      workspaceSlug={workspaceSlug}
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {hasMore && (
              <button
                className="w-full cursor-pointer rounded-ir-sm border border-dashed border-ir-border py-2 text-xs text-ir-muted transition-colors duration-150 ease-ir-standard hover:border-ir-primary/30 hover:text-ir-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                type="button"
              >
                Show {Math.min(PAGE_SIZE, posts.length - visibleCount)} more
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
