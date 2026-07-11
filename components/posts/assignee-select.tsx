"use client";

import { UserCircleIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { assignPostAction } from "@/app/actions/posts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  function handleChange(value: string) {
    const assigneeId = value === "unassigned" ? null : value;
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
      <span className="inline-flex items-center gap-1 text-xs text-ir-muted">
        <UserCircleIcon className="size-3" />
        {current.name || current.email}
      </span>
    ) : null;
  }

  return (
    <Select
      disabled={isPending}
      onValueChange={handleChange}
      value={currentAssigneeId ?? "unassigned"}
    >
      <SelectTrigger
        className="h-auto gap-1.5 rounded-ir-full border-0 bg-ir-muted-surface px-2.5 py-1 text-xs font-medium text-ir-heading"
        showChevron={false}
        size="sm"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="unassigned">Unassigned</SelectItem>
        {assignees.map((a) => (
          <SelectItem key={a.id} value={a.id}>
            {a.name || a.email}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
