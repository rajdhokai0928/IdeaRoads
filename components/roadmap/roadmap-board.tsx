import { InfoIcon } from "@phosphor-icons/react/dist/ssr";
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
        <div className="mt-4 mb-6 flex items-center gap-2 rounded-ir-md border border-ir-warning/30 bg-ir-warning/10 px-3 py-2 text-xs font-medium text-ir-warning">
          <InfoIcon className="size-3.5 shrink-0" />
          Admin view includes posts from private boards
        </div>
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
