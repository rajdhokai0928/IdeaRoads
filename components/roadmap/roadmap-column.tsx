"use client";

import { useState } from "react";
import type { RoadmapPost } from "@/lib/roadmap/queries";
import { RoadmapEmptyState } from "./roadmap-empty-state";
import { RoadmapPostCard } from "./roadmap-post-card";

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
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visible = posts.slice(0, visibleCount);
  const hasMore = posts.length > visibleCount;

  return (
    <div className="flex w-full min-w-0 flex-col md:w-80 md:shrink-0">
      {/* Column header — accent drawn from the workspace status colour */}
      <div
        className="mb-3 flex items-center justify-between gap-2 border border-border px-4 py-3"
        style={{ backgroundColor: `${color}12` }}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="inline-block size-2 shrink-0 rounded-full"
            style={{ backgroundColor: color }}
          />
          <h2 className="truncate text-sm font-semibold text-foreground">
            {name}
          </h2>
        </div>
        <span
          className="inline-flex shrink-0 items-center px-2 py-0.5 text-xs font-semibold"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {posts.length}
        </span>
      </div>

      {/* Post cards */}
      <div className="flex flex-col gap-2">
        {visible.length === 0 ? (
          <div className="border border-dashed border-border">
            <RoadmapEmptyState label={`Nothing in ${name} yet.`} />
          </div>
        ) : (
          <>
            {visible.map((post) => (
              <RoadmapPostCard
                isSignedIn={isSignedIn}
                key={post.id}
                post={post}
                useWorkspaceLinks={useWorkspaceLinks}
                workspaceSlug={workspaceSlug}
              />
            ))}
            {hasMore && (
              <button
                className="w-full py-2 text-xs text-muted-foreground hover:text-foreground border border-dashed border-border hover:border-border/80 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
