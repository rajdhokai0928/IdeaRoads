"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { setRoadmapSyncAction } from "@/app/actions/roadmap";

interface RoadmapSyncToggleProps {
  enabled: boolean;
  workspaceId: string;
}

// Inline "Sync from Feedback" control shown in the roadmap page header so admins
// can flip modes without visiting settings (Upvoty-style). Brand Admin only —
// only rendered by the page when the viewer is an admin.
export function RoadmapSyncToggle({
  workspaceId,
  enabled,
}: RoadmapSyncToggleProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function toggle(value: boolean) {
    if (value === enabled || isPending) {
      return;
    }
    startTransition(async () => {
      const result = await setRoadmapSyncAction({
        workspaceId,
        enabled: value,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(
        value
          ? "Roadmap now syncs from feedback"
          : "Roadmap is now managed manually"
      );
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2.5">
      <span className="text-xs font-medium text-muted-foreground">
        Sync from Feedback
      </span>
      <button
        aria-checked={enabled}
        aria-label="Sync roadmap from feedback"
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
          enabled ? "bg-primary" : "bg-muted"
        }`}
        disabled={isPending}
        onClick={() => toggle(!enabled)}
        role="switch"
        type="button"
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            enabled ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
      <span
        className={`text-xs font-semibold ${enabled ? "text-primary" : "text-muted-foreground"}`}
      >
        {enabled ? "On" : "Off"}
      </span>
    </div>
  );
}
