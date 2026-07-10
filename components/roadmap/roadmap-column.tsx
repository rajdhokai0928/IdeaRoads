"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import type { RoadmapPost } from "@/lib/roadmap/queries";
import { RoadmapEmptyState } from "./roadmap-empty-state";
import { RoadmapPostCard } from "./roadmap-post-card";
import { RoadmapStatusHeader } from "./roadmap-status-header";

const PAGE_SIZE = 10;

interface RoadmapColumnProps {
  color: string;
  isSignedIn: boolean;
  name: string;
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
}: RoadmapColumnProps) {
  const shouldReduceMotion = useReducedMotion();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visible = posts.slice(0, visibleCount);
  const hasMore = posts.length > visibleCount;

  return (
    <div className="flex w-full min-w-0 flex-col md:w-80 md:shrink-0">
      <RoadmapStatusHeader color={color} count={posts.length} name={name} />

      {/* Post cards */}
      <div className="flex flex-col gap-2">
        {visible.length === 0 ? (
          <div className="rounded-ir-card border border-dashed border-ir-border">
            <RoadmapEmptyState label={`Nothing in ${name} yet.`} />
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
                  <RoadmapPostCard
                    isSignedIn={isSignedIn}
                    post={post}
                    useWorkspaceLinks={useWorkspaceLinks}
                    workspaceSlug={workspaceSlug}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
            {hasMore && (
              <button
                className="w-full rounded-ir-sm border border-dashed border-ir-border py-2 text-xs text-ir-muted transition-colors duration-150 ease-ir-standard hover:border-ir-primary/30 hover:text-ir-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40"
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
