import type { RoadmapStatusColumn } from "@/lib/roadmap/queries";
import { RoadmapColumn } from "./roadmap-column";

interface RoadmapBoardProps {
  columns: RoadmapStatusColumn[];
  isAdmin?: boolean;
  isSignedIn: boolean;
  // Fixed per-route, never per-viewer: true only on the admin-shelled
  // /settings/roadmap page. The public /roadmap page never sets this, even
  // for signed-in members — the public portal must never redirect into the
  // workspace app on its own.
  useWorkspaceLinks?: boolean;
  workspaceSlug: string;
}

export function RoadmapBoard({
  columns,
  workspaceSlug,
  isSignedIn,
  isAdmin,
  useWorkspaceLinks,
}: RoadmapBoardProps) {
  return (
    <div className="px-6 pb-12">
      {isAdmin && (
        <div className="mb-6 mt-4 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300 text-xs font-medium">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-warning" />
          Admin view includes posts from private boards
        </div>
      )}

      {columns.length === 0 ? (
        <div className="mt-4 border border-dashed border-border px-4 py-16 text-center text-sm text-muted-foreground">
          No roadmap columns yet. Add feedback statuses to populate the roadmap.
        </div>
      ) : (
        // Kanban row: columns wrap on desktop when few, scroll horizontally when
        // many; stacks vertically on mobile. Mirrors the status set 1:1.
        <div className="flex flex-col gap-6 md:flex-row md:flex-wrap md:overflow-x-auto md:pb-2">
          {columns.map((col) => (
            <RoadmapColumn
              color={col.color}
              isSignedIn={isSignedIn}
              key={col.id}
              name={col.name}
              posts={col.posts}
              useWorkspaceLinks={useWorkspaceLinks}
              workspaceSlug={workspaceSlug}
            />
          ))}
        </div>
      )}
    </div>
  );
}
