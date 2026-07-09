"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  publishPostAction,
  unpublishPostAction,
  updatePostStatusAction,
} from "@/app/actions/posts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface WorkspaceStatus {
  color: string;
  id: string;
  isArchived: boolean;
  name: string;
  slug: string;
}

interface StatusSelectProps {
  canEdit: boolean;
  currentStatus: string;
  // Publication state (posts.isDraft), distinct from the workflow status. When
  // true the "Draft" option is selected; picking a workflow status publishes.
  isDraft: boolean;
  postId: string;
  workspaceId: string;
  workspaceStatuses: WorkspaceStatus[];
}

// Sentinel for the Draft publication state in the same dropdown as the workflow
// statuses. Underscored so it can never collide with a real status slug.
const DRAFT_VALUE = "__draft__";
const DRAFT_COLOR = "#6b7280";

export default function StatusSelect({
  postId,
  workspaceId,
  currentStatus,
  isDraft,
  canEdit,
  workspaceStatuses,
}: StatusSelectProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const activeStatuses = workspaceStatuses.filter((s) => !s.isArchived);
  const current = workspaceStatuses.find((s) => s.slug === currentStatus);

  function handleChange(value: string) {
    if (value === DRAFT_VALUE) {
      // Already a draft → no unnecessary update (requirement 3).
      if (isDraft) {
        return;
      }
      // Published → revert to draft, reusing the existing publish/draft flow.
      startTransition(async () => {
        await unpublishPostAction({ postId, workspaceId });
        router.refresh();
      });
      return;
    }

    // A workflow status was chosen.
    if (isDraft) {
      // Upvoty parity: picking a workflow status on a draft publishes it into
      // that status. Set the status first (only if it changed), then publish.
      startTransition(async () => {
        if (value !== currentStatus) {
          await updatePostStatusAction({ postId, workspaceId, status: value });
        }
        await publishPostAction({ postId, workspaceId });
        router.refresh();
      });
      return;
    }

    // Published post: plain status change (unchanged existing behavior).
    if (value === currentStatus) {
      return;
    }
    startTransition(async () => {
      await updatePostStatusAction({ postId, workspaceId, status: value });
      router.refresh();
    });
  }

  const displayName = isDraft
    ? "Draft"
    : (current?.name ?? currentStatus.replace(/_/g, " "));
  const displayColor = isDraft ? DRAFT_COLOR : (current?.color ?? "#6b7280");

  if (!canEdit) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium"
        style={{
          backgroundColor: `${displayColor}18`,
          color: displayColor,
          borderRadius: 2,
        }}
      >
        <span
          className="inline-block w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: displayColor }}
        />
        {displayName}
      </span>
    );
  }

  return (
    <Select
      disabled={isPending}
      onValueChange={handleChange}
      value={isDraft ? DRAFT_VALUE : currentStatus}
    >
      <SelectTrigger
        className="h-auto gap-1.5 rounded-xs border-0 bg-muted px-2.5 py-1 text-xs font-medium text-foreground"
        size="sm"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {/* Draft (publication state) first, matching Upvoty. */}
        <SelectItem value={DRAFT_VALUE}>Draft</SelectItem>
        {activeStatuses.map((s) => (
          <SelectItem key={s.slug} value={s.slug}>
            {s.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
