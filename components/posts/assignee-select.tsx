"use client";

import { ChevronDown, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { assignPostAction } from "@/app/actions/posts";

interface Assignee {
  email: string;
  id: string;
  name: string | null;
}

interface AssigneeSelectProps {
  assignees: Assignee[];
  canEdit: boolean;
  currentAssigneeId: string | null;
  postId: string;
  workspaceId: string;
}

// Brand-Admin-only control to assign feedback to a Team Member. Only
// rendered for workspace members (post-detail-content gates it), matching
// PinButton/VoterListButton — this is an internal triage affordance, never
// shown to the public.
export default function AssigneeSelect({
  postId,
  workspaceId,
  currentAssigneeId,
  canEdit,
  assignees,
}: AssigneeSelectProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const current = assignees.find((a) => a.id === currentAssigneeId) ?? null;

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    const assigneeId = value === "" ? null : value;
    if (assigneeId === currentAssigneeId) {
      return;
    }
    startTransition(async () => {
      const result = await assignPostAction({
        postId,
        workspaceId,
        assigneeId,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  // Read-only view (Team Members): show who it's assigned to, or nothing.
  if (!canEdit) {
    return current ? (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <UserRound className="size-3" />
        {current.name ?? current.email}
      </span>
    ) : null;
  }

  return (
    <div className="relative inline-flex items-center">
      <select
        className="appearance-none bg-muted pl-2.5 pr-7 py-1 text-xs font-medium text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        disabled={isPending}
        onChange={handleChange}
        style={{ borderRadius: 2 }}
        value={currentAssigneeId ?? ""}
      >
        <option value="">Unassigned</option>
        {assignees.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name ?? a.email}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-1.5 size-3 text-muted-foreground opacity-60" />
    </div>
  );
}
