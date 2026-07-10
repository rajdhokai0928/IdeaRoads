"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  publishPostAction,
  unpublishPostAction,
  updatePostStatusAction,
} from "@/app/actions/posts";
import { PostStatusBadge } from "@/components/posts/post-status-badge";
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

  if (!canEdit) {
    if (isDraft) {
      return (
        <span className="inline-flex items-center rounded-ir-full bg-ir-warning/10 px-2 py-0.5 text-[11px] font-medium text-ir-warning">
          Draft
        </span>
      );
    }
    return (
      <PostStatusBadge
        status={currentStatus}
        workspaceStatuses={workspaceStatuses}
      />
    );
  }

  return (
    <Select
      disabled={isPending}
      onValueChange={handleChange}
      value={isDraft ? DRAFT_VALUE : currentStatus}
    >
      <SelectTrigger
        className="h-auto gap-1.5 rounded-ir-full border-0 bg-ir-muted-surface px-2.5 py-1 text-xs font-medium text-ir-heading"
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
