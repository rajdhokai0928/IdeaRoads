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
